package main

import (
	"bytes"
	"io"
	"net/http"
	"os"

	"github.com/buger/jsonparser"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

var (
	userSessions = make(map[string]string)
	legacyHost   = os.Getenv("LEGACY")
)

func main() {
	if legacyHost == "" {
		legacyHost = "localhost:4567"
	}

	e := echo.New()
	e.Use(middleware.Logger())

	e.POST("/user", registerUser)
	e.POST("/result", postResult)
	e.POST("/vote", postVote)
	e.GET("/summary", getSummary)

	e.Logger.Fatal(e.Start(":5000"))
}

func registerUser(c echo.Context) error {
	data, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	username, err := jsonparser.GetString(data, "username")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}
	sessionID, _ := jsonparser.GetString(data, "session_id")

	if username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Username is required")
	}
	if username == "admin" {
		return echo.NewHTTPError(http.StatusBadRequest, "Admin is not allowed")
	}
	if prev, exists := userSessions[username]; exists {
		if sessionID == prev {
			return c.JSON(http.StatusCreated, echo.Map{
				"username":   username,
				"session_id": sessionID,
			})
		}
		return echo.NewHTTPError(http.StatusBadRequest, "Already exists")
	}

	if sessionID == "" {
		tmp, _ := uuid.NewRandom()
		sessionID = tmp.String()
	}
	userSessions[username] = sessionID

	return c.JSON(http.StatusCreated, echo.Map{
		"username":   username,
		"session_id": sessionID,
	})
}

func waf(data []byte) bool {
	return bytes.Contains(data, []byte("admin"))
}

func handleSession(c echo.Context, data []byte) error {
	if waf(data) {
		return echo.NewHTTPError(http.StatusBadRequest, "Bad text detected")
	}

	sessionID := c.Request().Header.Get("Authorization")
	username, err := jsonparser.GetString(data, "username")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	if _, exists := userSessions[username]; !exists {
		return echo.NewHTTPError(http.StatusUnauthorized, "Invalid session")
	}
	if userSessions[username] != sessionID {
		return echo.NewHTTPError(http.StatusUnauthorized, "Invalid session")
	}

	return nil
}

func postResult(c echo.Context) error {
	data, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if err := handleSession(c, data); err != nil {
		return err
	}

	resp, err := http.Post("http://"+legacyHost+"/result", "application/json", bytes.NewBuffer(data))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSONBlob(resp.StatusCode, body)
}

func postVote(c echo.Context) error {
	data, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if err := handleSession(c, data); err != nil {
		return err
	}

	resp, err := http.Post("http://"+legacyHost+"/vote", "application/json", bytes.NewBuffer(data))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	defer resp.Body.Close()
	_, err = io.ReadAll(resp.Body)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(resp.StatusCode)
}

func getSummary(c echo.Context) error {
	resp, err := http.Get("http://" + legacyHost + "/summary")
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSONBlob(resp.StatusCode, body)
}
