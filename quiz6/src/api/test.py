import requests
import random
import string

#BASE_URL = "http://127.0.0.1:5000"
BASE_URL = "http://127.0.0.1:30001/"
username = "satos2"


def register_user(username):
    url = f"{BASE_URL}/user"
    response = requests.post(url, json={"username": username})
    print(response)
    if response.status_code == 201:
        return response.json().get("session_id")
    else:
        raise Exception(f"User registration failed: {response.text}")


def vote(session_id, username, candidate):
    url = f"{BASE_URL}/vote"
    headers = {"Authorization": session_id}
    response = requests.post(url, headers=headers, json={
                             "username": username, "candidate": candidate})
    print(response.text)
    if response.status_code != 200:
        raise Exception(f"Voting failed: {response.text}")


def get_summary():
    url = f"{BASE_URL}/summary"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to get summary: {response.text}")
    return response.json()


def get_user_info(username, session_id):
    url = f"{BASE_URL}/result"
    headers = {"Authorization": session_id}
    response = requests.post(url, headers=headers, json={
        "username": username})
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to get user info: {response.text}")


def generate_random_username(length):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for i in range(length))


def main():
    users = [generate_random_username(8) for _ in range(5)]
    for username in users:
        session_id = register_user(username)
        print(f"Registered user '{username}' with session ID: {session_id}")

        candidate = "Palutena"
        # vote_result = vote(session_id, username, candidate)
        vote(session_id, username, candidate)

        info = get_user_info(username, session_id)
        print(info)

    summary_result = get_summary()
    print(summary_result)


if __name__ == "__main__":
    main()
