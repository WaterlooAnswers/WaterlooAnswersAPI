[![Build Status](https://travis-ci.org/sahiljain/WaterlooAnswersAPI.svg?branch=master)](https://travis-ci.org/sahiljain/WaterlooAnswersAPI)
[![Coverage Status](https://coveralls.io/repos/wrahman0/WaterlooAnswersAPI/badge.svg?branch=master)](https://coveralls.io/r/wrahman0/WaterlooAnswersAPI?branch=master)

Please refer to the [API Documentation](http://docs.waterlooanswers.apiary.io/ "API Documentation"). 

Project Management is done through [Pivotal Tracker](https://www.pivotaltracker.com/projects/1142404 "Pivotal tracker"). 

# Install Notes

1. Install [Node](http://nodejs.org/). This will also install `npm`.
2. Install [MongoDB](http://www.mongodb.org/downloads).
2. Clone this repo and navigate to the project root folder.
3. Run `git submodule update --init --recursive`.
4. Run `npm install` (This will download and install dependencies into */node_modules*.
5. Run `mkdir database`.
6. Open a new terminal and run `mongod --dbpath "./database"`. Keep this terminal open while running your local server.
5. Run `node server` to start the local server on *localhost*.
6. Go to `localhost:8080` in your browser!

## How to Contribute

1. Fork this repo
2. Make changes
3. Make a pull request!
4. The build must pass, and you must add test cases for any features you've added.
