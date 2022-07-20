<?php

/* Can you leak the secret? */
error_reporting(0);
define("SECRET", "***SECRET***");

/* WAF */
$query = file_get_contents("php://input");
if(!$query){
  exit("Please send JSON data..");
}
$filter_list = [
  "php",
  "fil",
  "dat",
  "zip",
  "pha",
  "exp",
  "/",
  ".",
];
foreach ($filter_list as $filter) {
  if(stripos($query, $filter) !== false) {
    exit("Filtered!");
  }
}

/* Read file from JSON */
$output = file_get_contents(json_decode($query, true)['fn']);

/* Block reading PHP files */
if(stripos($output, "<?php") !== false){
  exit("Filtered!");
}

exit(json_encode(["data" => $output]));

?>