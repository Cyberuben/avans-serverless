#!/bin/bash
hosted="http://10.1.0.1"
serverless="http://10.1.0.1"

for numCores in 1 2 3 4;
do
	for rate in 100 200 500;
	do
		echo "POST $hosted:$((8000 + numCores))/login" | ./vegeta attack -connections=1000 -body=./body.json -duration=1m -rate=$rate -header="Content-Type: application/json" > results/hosted-$numCores-thread-$rate-rate.bin;
		echo "test hosted ($numCores cores) w/ $rate requests/second finished";
	done
done

#for rate in 100 200 500 1000 5000 10000;
#do
#	echo "POST $serverless/login" | ./vegeta attack -body=./body.json -duration=1m -rate=$rate -header="Content-Type: application/json" > results/serverless-$numCores-thread-$rate-rate.bin;
#	echo "test serverless w/ $rate requests/second finished";
#done