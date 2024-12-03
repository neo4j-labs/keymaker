#!/bin/bash

# Define the services and their ports using arrays
SERVICES=("admin-api" "engine-api" "ui")

PORTS=(4000 4001 3000)

# Function to display usage
usage() {
  echo "Usage: $0 {start|stop} --service [service1 service2 ...]"
  echo "Available services: ${SERVICES[*]}"
  exit 1
}

# Check if at least one argument is provided
if [ "$#" -lt 1 ]; then
  usage
fi

# Parse the command (start or stop)
COMMAND=$1
shift

# Initialize an empty array for specified services
SPECIFIED_SERVICES=()

# Function to find the port for a service
get_port_for_service() {
  SERVICE_NAME=$1
  for i in "${!SERVICES[@]}"; do
    if [[ "${SERVICES[$i]}" == "$SERVICE_NAME" ]]; then
      echo "${PORTS[$i]}"
      return
    fi
  done
  echo ""
}

# Parse options
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --service)
      shift
      while [[ "$#" -gt 0 ]] && [[ ! "$1" =~ ^-- ]]; do
        SPECIFIED_SERVICES+=("$1")
        shift
      done
      ;;
    *)
      echo "Unknown parameter: $1"
      usage
      ;;
  esac
done

# If no services specified, use all services
if [ "${#SPECIFIED_SERVICES[@]}" -eq 0 ]; then
  SPECIFIED_SERVICES=("${SERVICES[@]}")
fi

# Function to start a service
start_service() {
  SERVICE_NAME=$1
  echo "Starting $SERVICE_NAME..."

  SERVICE_DIR="./$SERVICE_NAME"

  # Navigate to the service directory
  (
    cd "$SERVICE_DIR" || exit

    # Start the service in the background and get its PID
    ./start.sh &

    # Save the PID to a file
    echo "$SERVICE_NAME has been started"
  )
}

# Function to stop a service
stop_service() {
  SERVICE_NAME=$1
  PORT=$(get_port_for_service "$SERVICE_NAME")
  if [[ -z "$PORT" ]]; then
    echo "Error: Unknown service $SERVICE_NAME"
    usage
  fi

  echo "Stopping $SERVICE_NAME running on port $PORT..."

  # Filter logic based on service type
  case "$SERVICE_NAME" in
    "admin-api"|"engine-api")
      FILTER="node"
      ;;
    "ui")
      FILTER="nginx"
      ;;
    *)
      echo "Error: No filter logic defined for $SERVICE_NAME."
      usage
      ;;
  esac

  # Get PIDs for the specified port and filter by process type
  PIDS=$(sudo lsof -ti tcp:$PORT | xargs ps -p | grep "$FILTER" | awk '{print $1}')

  if [[ -z "$PIDS" ]]; then
    echo "No $FILTER processes found running on port $PORT for $SERVICE_NAME."
    return
  fi

  # Kill each process and confirm termination
  for PID in $PIDS; do
    echo "Attempting to stop process $PID..."
    sudo kill -9 "$PID"

    # Retry killing if the process still exists
    for i in {1..3}; do
      if ps -p "$PID" > /dev/null 2>&1; then
        echo "Process $PID still running. Retrying ($i/3)..."
        sudo kill -9 "$PID"
        sleep 1
      else
        echo "Process $PID successfully stopped."
        break
      fi
    done

    # Final check
    if ps -p "$PID" > /dev/null 2>&1; then
      echo "Failed to stop process $PID after multiple attempts."
    fi
  done
}

# Execute the command for each specified service
case "$COMMAND" in
  start)
    for SERVICE in "${SPECIFIED_SERVICES[@]}"; do
      if [[ " ${SERVICES[*]} " == *" $SERVICE "* ]]; then
        start_service "$SERVICE"
      else
        echo "Service $SERVICE is not recognized."
      fi
    done
    ;;
  stop)
    for SERVICE in "${SPECIFIED_SERVICES[@]}"; do
      if [[ " ${SERVICES[*]} " == *" $SERVICE "* ]]; then
        stop_service "$SERVICE"
      else
        echo "Service $SERVICE is not recognized."
      fi
    done
    ;;
  *)
    usage
    ;;
esac
