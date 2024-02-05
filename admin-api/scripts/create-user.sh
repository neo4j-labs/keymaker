USERID=$1
PASSWORD=$2
NAME=$3
PICTURE=$4
echo "Creating $USERID"
if [ "$#" -lt 3 ];
then
  echo 'Usage: ./create-user.sh <email> <password> <name> [picture] [graphql port] [https]'
  exit 1
fi 

PORT=4000
if [[ -n "$5" ]]; then PORT=$5; fi

PROTOCOL=http
if [[ -n "$6" ]]; then PROTOCOL=$6; fi

curl "$PROTOCOL://localhost:$PORT/graphql" \
-H 'content-type: application/json' \
--data '{"query":"mutation {\n  createUserSignUp(input: {email: \"'"$USERID"'\", password: \"'"$PASSWORD"'\", name: \"'"$NAME"'\", picture: \"'"$PICTURE"'\"}) {\n    email\n    name\n    picture\n  }\n}\n"}' \
--compressed
