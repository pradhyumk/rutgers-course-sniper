# Rutgers Course Notifier

This project is based on the [discord-course-notifier (archived)](https://github.com/pradhyumk/discord-course-notifier) webhook.  
Currently, this bot only supports fetching information for the New Brunswick campus of Fall 2021.

## Ingesting Data (`ingest_db.py`)
It would be a waste of time searching through a large dump file every time a course is added to notify. The MongoDB database ingests only necessary information (and some optional values for future enhancements) for fast access times.  

This script is available [here](https://github.com/pradhyumk/discord-course-notifier/blob/master/ingest_db.py).

Run `python3 ingest_db.py --help` for arguments.

## Usage 
Once the MongoDB cluster has been populated:
1.  Fill in the values in `SAMPLE.env` and remove `SAMPLE` from the filename.
2.  Run: `npm install`
3.  Start the bot: `npm start`

## Endpoints
Rutgers uses the following endpoints in the [Schedule of Classes](https://sis.rutgers.edu/soc/):
### Course Information:  
`https://sis.rutgers.edu/soc/api/courses.json?year=YEAR&term=TERM&campus=CAMPUS`  

### Open Courses  
Responds with a list containing index numbers for open sections.  
`https://sis.rutgers.edu/soc/api/openSections.json?year=YEAR&term=TERM&campus=CAMPUS`

### URL Parameters:  

`TERM` (Integer):
* `1` - Spring
* `7` - Summer
* `9` - Fall
* `0` - Winter  

*Don't ask me why these numbers are random.*
  
`YEAR` (Integer)
* A year.

`CAMPUS` (String):
* `NB` - New Brunswick
* `NK` - Newark
* `CM` - Camden
* `ONLINE_NB` - New Brunswick - Online and Remote Instruction Courses
* `ONLINE_NK` - Newark - Online and Remote Instruction Courses
* `ONLINE_CM` - Camden - Online and Remote Instruction Courses
* `B` - Burlington County Community College - Mt Laurel
* `CC` - Camden County College - Blackwood Campus
* `H` - County College of Morris
* `CU` - Cumberland County College
* `MC` - Denville - RU-Morris
* `WM` - Freehold WMHEC - RU-BCC
* `L` - Lincroft - RU-BCC
* `AC` - Mays Landing - RU-ACCC
* `J` - McGuire-Dix-Lakehurst RU-JBMDL
* `D` - Mercer County Community College
* `RV` - North Branch - RU-RVCC

## License
The source code for this project is licensed under the MIT License.