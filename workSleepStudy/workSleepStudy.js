/*******************************************************************************
* WORK SLEEP STUDY 
* VERSION ONE
* JONATHAN SIRRINE
*
* PROCESSES: 
*    -ADD WORK TO SCHEDULE
*    -ADD SLEEP TO SCHEDULE
	
*    -ADD STUDY PREFERENCES
*
*
*******************************************************************************/


//angular app and controller for hour and half hour options
var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope) {
	$scope.hourOption = 7;
});


window.onload = function(){
	
	/************************************************************************* 
	*  As soon as the DOM is loaded, this function does the tedious job of
	*  adding classes to each cell
	**************************************************************************/
	initCells();
	
	/*********************************************************
	*
	*INITIALIZE VARIABLES
	*
	**********************************************************/
	//OBJECT VARIABLES ?
	var totalWorkHours;
	var totalSleepHours;
	var totalFreeHours = 0;
	var nonWorkSleepSlots = {};
	var studyBlocks = {};
	var bufferedBlocks;
	var startingTomorrow = false;
	var startingToday = false;
	var startAtBeginning = true;
	var hoursAlreadyStudied = 0;
	
	//HTML VARIABLES
	var workQuiz = document.getElementById('workQuiz');
	var sleepQuiz = document.getElementById('sleepQuiz');
	var studyQuiz = document.getElementById('studyQuiz');
	var bufferQuiz = document.getElementById('bufferQuiz');
	var startTimeQuiz = document.getElementById('startTimeQuiz');
	var mainMenu = document.getElementById('info');
	
	//STORAGE VARIABLE
	var ls = window.localStorage;
	
	/* FOR RESETTING LOCAL STORAGE WHEN TESTING
	if(ls.workSleepStudyData){
		ls.removeItem('workSleepStudyData');
	}
	*/
	
	
	/*********************************************************
	* Creates schedule with user data in storage.
	* 
	*
	**********************************************************/
	if(ls.workSleepStudyData){
		
		//turn object in storage to object in script
		var wSSD = JSON.parse(ls.workSleepStudyData);
		console.log(wSSD);
		schedule = wSSD.schedule;
		
		//handle work
		if(!schedule.work){
			schedule.work = null;
		}
		else{
			if(displayWorkSched(schedule.work))
				document.getElementById('beginWork').innerHTML = "&#10004; Work";
		}
		
		//handle sleep
		if(!schedule.sleep){
			schedule.sleep = null;
		}
		else{
			if(displaySleep(schedule.sleep))
				document.getElementById('beginSleep').innerHTML = "&#10004; Sleep";
		}
		
		//handle credits
		if(!schedule.study){
			schedule.study = {
				'hoursPerWeek':0,
				'nonWorkSleepSlots': {}
			};
		}
		else{
			if(developStudy(schedule.study.hoursPerWeek, schedule.study.nonWorkSleepSlots))
				document.getElementById('beginStudy').innerHTML = "&#10004; Credits";
		}
		
		
		if(wSSD.studyBlocks)
			studyBlocks = wSSD.studyBlocks;
	}

	//Resets and opens work quiz
	document.getElementById('restart').addEventListener('click', function(){
			
			sleepQuiz.classList.remove('fadeIn');
			document.getElementById('day').innerHTML = days[0];
			document.getElementById('event').innerHTML = 'start';
			document.getElementById('question').setAttribute('data-type','start');
		
			workQuiz.classList.remove('fadeIn');
			studyQuiz.classList.remove('fadeIn');
			bufferQuiz.classList.remove('fadeIn');
			
			mainMenu.classList.add('fadeIn');
			startTimeQuiz.classList.remove('fadeIn');
			document.getElementById('finalDataDiv').classList.remove('fadeIn');
			document.getElementById('studyMsg').innerHTML = '';
	});
	
	/***************************************************************************
	*    WORK SECTION
	***************************************************************************/
	var days = ['Monday', 'Tuesday', 'Wednesday', 
				'Thursday', 'Friday', 'Saturday', 'Sunday'];
	var hourSets = document.getElementsByClassName('hourSet');
	
	//opens work quiz
	document.getElementById('beginWork').addEventListener('click', function(){
		mainMenu.classList.remove('fadeIn');
		workQuiz.classList.add('fadeIn');
	});
	
	//add event listener to each option button
	for(item in hourSets){
		if(hourSets[item].innerHTML){
			
			//User selects specific start or stop time
			hourSets[item].addEventListener('click', function(){
				if(!schedule.work)
					schedule.work = {};
				
				if(document.getElementById('event').innerHTML === 'start'){
					document.getElementById('event').innerHTML = 'stop';
					var day = document.getElementById('day').innerHTML;
					var dayLower = day.toLowerCase();
					if(!schedule.work[dayLower])
						schedule.work[dayLower] = {'start':"",'stop':""};
					schedule.work[dayLower].start = this.innerHTML;
				}
				else{
					document.getElementById('event').innerHTML = 'start';
					var day = document.getElementById('day').innerHTML;
					var dayLower = day.toLowerCase();
					if(!schedule.work[dayLower])
						schedule.work[dayLower] = null;
					schedule.work[dayLower].stop = this.innerHTML;
					var ind = days.indexOf(day);
					if(ind === days.length - 1){
						/*******************************************************
						
						
							user chose LAST WORK STOP TIME
						
						
						
						*******************************************************/
						ind = 5;
						
						//hide workQuiz & move to sleepQuiz
						workQuiz.classList.remove('fadeIn');
						mainMenu.classList.add('fadeIn');
						
						//displays work schedule
						if(displayWorkSched(schedule.work))
							document.getElementById('beginWork').innerHTML = "&#10004; Work";
						
						//LOCAL STORE DATA***********************************
						var wSSD = {};
						wSSD.schedule = schedule;
						ls.setItem('workSleepStudyData',JSON.stringify(wSSD));
						console.log('data stored: ');
						console.log(wSSD);
					}
					document.getElementById('day').innerHTML = days[ind + 1];
				}
				
			});
		}
	}

	//add event listener to skip button
	document.getElementById('skip').addEventListener('click', function(){
		
		//this block is same as else block in hoursSets eventlistener click 
		//function///////////////////////////////////////////////
		
		document.getElementById('event').innerHTML = 'start';
		var day = document.getElementById('day').innerHTML;
		var dayLower = day.toLowerCase();
		schedule.work[dayLower] = null;
		var ind = days.indexOf(day);
		if(ind === days.length - 1){
			/*******************************************************
			
			
				user SKIPPED LAST DAY
			
			
			
			*******************************************************/
			ind = 5;
			
			//otherwise hide questionaire
			workQuiz.classList.remove('fadeIn');
			mainMenu.classList.add('fadeIn');
			
			//displays work schedule
			if(displayWorkSched(schedule.work))
				document.getElementById('beginWork').innerHTML = "&#10004; Work";
			
			//LOCAL STORE DATA***********************************
			var wSSD = {};
			wSSD.schedule = schedule;
			ls.setItem('workSleepStudyData',JSON.stringify(wSSD));
			console.log('data stored: ');
			console.log(wSSD);
		}
		document.getElementById('day').innerHTML = days[ind + 1];
	});

	/*
		DISPLAY WORK SCHEDULE
	*/
	function displayWorkSched(obj){
		if(obj == null)
			return false;
		
		totalWorkHours = 0;
		for(day in obj){
			if(obj[day] && obj[day].stop != ""){
				var time = stripTime(obj[day].start, obj[day].stop);
				var start = time[0];
				var stop = time[1];
				
				//mark all cells in day column from start to finish as work color
				var dayCells = document.getElementsByClassName(day);
				for(cell in dayCells){
					if(!isNaN(cell)){
						var curCell = dayCells[cell];
						var timeSlot = curCell.classList[1];
						if(parseInt(start) < parseInt(stop)){
							if(parseInt(start) <= parseInt(timeSlot) && parseInt(stop) >= parseInt(timeSlot) + 30){
								dayCells[cell].style.backgroundColor = 'red';
								dayCells[cell].setAttribute('data-type','work');
								totalWorkHours += 0.5;
							}
						}
						else{
							if(parseInt(timeSlot) < parseInt(stop) || parseInt(timeSlot) >= parseInt(start)){
								dayCells[cell].style.backgroundColor = 'red';
								dayCells[cell].setAttribute('data-type','work');
								totalWorkHours += 0.5;
							}
						}
					}
				}
				
			}
		}
		document.getElementById('workReport').innerHTML = "You are scheduled for " + totalWorkHours + " hours of work.";
		return true;
	}

	/***************************************************************************
	*    SLEEP SECTION
	***************************************************************************/
	var sleepSets = document.getElementsByClassName('sleepSet');
	
	//Opens the sleep quiz
	document.getElementById('beginSleep').addEventListener('click', function(){
		mainMenu.classList.remove('fadeIn');
		sleepQuiz.classList.add('fadeIn');
	});
	
	//add event listener to each option
	for(item in sleepSets){
		if(sleepSets[item].innerHTML){
			sleepSets[item].addEventListener('click', function(){
				if(!schedule.sleep)
					schedule.sleep = {};
				
				var question = document.getElementById('question');
				var type = question.attributes['data-type'].value;
				if(type === 'start'){
					schedule.sleep.start = this.innerHTML;
					question.innerHTML = "What time do wake up?";
					question.setAttribute('data-type','stop');
				}
				else{
					/*
						user chose WAKE UP TIME
					*/
					sleepQuiz.classList.remove('fadeIn');
					info.classList.add('fadeIn');
					schedule.sleep.stop = this.innerHTML;
					question.setAttribute('data-type','start');
					question.innerHTML = "What time do you "+
					"start trying to get to bed?";
					
					//LOCAL STORE DATA***********************************
					var wSSD = {};
					wSSD.schedule = schedule;
					ls.setItem('workSleepStudyData',JSON.stringify(wSSD));
					console.log('data stored: ');
					console.log(wSSD);
					
					if(displaySleep(schedule.sleep))
						document.getElementById('beginSleep').innerHTML = "&#10004; Sleep";
				}
			});
		}
	}

	/*
		DISPLAY SLEEP SCHEDULE & ESTABLISH FREE TIME
	*/
	function displaySleep(obj){
		if(obj == null)
			return false;
		
		totalSleepHours = 0;
		var nonWorkSleepSlots = {};
		var nights = ['monday', 'tuesday', 'wednesday', 
					  'thursday', 'friday', 'saturday', 'sunday'];
		var time;
		var start;
		var stop;
		if(obj.stop != ""){
			time = stripTime(obj.start, obj.stop);
			start = time[0];
			stop = time[1];
		}

		nights.forEach(function(curVal){
			var dayCells = document.getElementsByClassName(curVal);
			for(cell in dayCells){
				if(!isNaN(cell) && time){
					var curCell = dayCells[cell];
					var timeSlot = curCell.classList[1];
					if(parseInt(start) > parseInt(stop)){
						if(parseInt(timeSlot) < parseInt(stop) || parseInt(timeSlot) >= parseInt(start)){
							//HIDE SLEEP
							console.log(curCell.parentElement);
							curCell.parentElement.style.display = 'none';
							//curCell.style.backgroundColor = 'lightblue';
							curCell.setAttribute('data-type','sleep');
							totalSleepHours += 0.5;
						}
						else{
							if(curCell.getAttribute('data-type') != 'work'){
								curCell.setAttribute('data-type','free');
								curCell.style.backgroundColor = 'white';
								if(!nonWorkSleepSlots[curCell.classList[0]]){ 
									nonWorkSleepSlots[curCell.classList[0]] = [];
								}
								nonWorkSleepSlots[curCell.classList[0]].push(curCell);
							}
							curCell.parentElement.style.display = 'table-row';
						}
					}
					else{
						if(parseInt(start) <= parseInt(timeSlot) && parseInt(stop) >= parseInt(timeSlot) + 30){
							//HIDE SLEEP
							curCell.parentElement.style.display = 'none';
							curCell.style.backgroundColor = 'lightblue';
							curCell.setAttribute('data-type','sleep');
							totalSleepHours += 0.5;
						}
						else{
							if(curCell.getAttribute('data-type') != 'work'){
								curCell.setAttribute('data-type','free');
								curCell.style.backgroundColor = 'white';
								if(!nonWorkSleepSlots[curCell.classList[0]]){ 
									nonWorkSleepSlots[curCell.classList[0]] = [];
								}
								nonWorkSleepSlots[curCell.classList[0]].push(curCell);
							}
							curCell.parentElement.style.display = 'table-row';
						}
					}
				}
			}
		});
		document.getElementById('sleepReport').innerHTML = "You are looking at " + 
		(totalSleepHours / 7) + " hours of sleep a night";
		schedule.study.nonWorkSleepSlots = nonWorkSleepSlots;
		return true;
	}
	
	
	/***************************************************************************
	*    STUDY SECTION
	***************************************************************************/
	var studySets = document.getElementsByClassName('studySet');
	
	//Opens the study quiz
	document.getElementById('beginStudy').addEventListener('click', function(){
		mainMenu.classList.remove('fadeIn');
		studyQuiz.classList.add('fadeIn');
	});	
	
	//add event listener to options
	for(item in studySets){
		if(studySets[item].innerHTML){
			studySets[item].addEventListener('click', function(){
				/*
					user chose CREDIT AMOUNT
				*/
				var creditsThisSemester = parseInt(this.innerHTML);
				schedule.study.hoursPerWeek = creditsThisSemester * 3;
				studyQuiz.classList.remove('fadeIn');
				mainMenu.classList.add('fadeIn');
				document.getElementById('errMsg').innerHTML = '';
				if(developStudy(schedule.study.hoursPerWeek, schedule.study.nonWorkSleepSlots))
					document.getElementById('beginStudy').innerHTML = "&#10004; Credits";
			});
		}
	}
	
	/***************************************************************************
	* THIS FUNCTION 
	* integer: studyHours, the amount of time their choosen credits 
	* 		   require them to study (i.e. 11 credits equates to 33 studyHours)
	* object: nonWorkSleepSlots, keys in object are days (monday, tuesday,...)
	*         whose values are arrays. In the arrays are unscheduled cells in 
	*         the schedule table
	*         
	* FIRST: checks to see if there will be enough time for the credit hours
	*         IF NOT: The user is taken back to choose credits
	*
	* SECOND: calls the readyBufferQuiz fnc
	***************************************************************************/
	function developStudy(studyHours, nonWorkSleepSlots){
		if(!studyHours || !nonWorkSleepSlots)
			return false;
		console.log("studyHours: " + studyHours);
		console.log(nonWorkSleepSlots);
		totalFreeHours = 0;
		var perDay = studyHours/7;
		for(op in nonWorkSleepSlots){
			if(nonWorkSleepSlots[op]){
				
				//totalFreeHours are the hours in a week not working or sleeping
				totalFreeHours += nonWorkSleepSlots[op].length;
			}
		}
		totalFreeHours /= 2;
		var totalHours = 24 * 7;
	
		document.getElementById('studyReport').innerHTML = "You have " + 
		totalFreeHours + " hours with which to do " + studyHours +
		" hours of coursework.<br />";
		
		if(totalFreeHours < studyHours){
			/**************************************************
				IMPOSSIBLE TO SCHEDULE ENOUGH STUDY TIME
			**************************************************/
			var errHead = document.createElement('span');
			errHead.innerHTML = "There is not enough time to complete your " + 
			studyHours/3 + " credits.<br />";
			
			errHead.innerHTML += studyHours/3 + " credits x " + 
			"3 hours per credit = " + studyHours + 
			' hours of coursework.<br />';
			
			//find max credits
			var testCredit = 0;
			while(testCredit * 3 <= totalFreeHours){
				testCredit++;
			}
			testCredit--;
			
			errHead.innerHTML += "<br />The most you can take is " + 
			testCredit + " credits.<br />";
			
			document.getElementById('errMsg').appendChild(errHead);
			mainMenu.classList.remove('fadeIn');
			studyQuiz.classList.add('fadeIn');
			return false;
		}
		else{
			/*
				CONTINUE SCHEDULING PROCESS
				goes through each nonWorkSleepSlot and
				creates study blocks object
				
				studyBlocks obj is similar to nonWorkSleepSlot but
				in each day the arrays are split up if there is anything that
				would split up the study block for the day. 
			*/
			var studyBlocks = {};
			var numOfBlocks = 0;
			for(op in nonWorkSleepSlots){
				if(nonWorkSleepSlots[op]){
					studyBlocks[op] = {};
					var blockNum = 1;
					var postVal;
					var postDay;
					var day;
					var toggle;
					nonWorkSleepSlots[op].forEach(function(curVal){
						var time = curVal.classList[1];
						var day = curVal.classList[0];
						var madeNewArr = false;
						if(day != postDay && postDay){
							postVal = undefined;
						}
						if(!studyBlocks[op][blockNum]){
							studyBlocks[op][blockNum] = [];
						}
						
						if(parseInt(time) != (postVal + toggle) && postVal){
							blockNum++;
							numOfBlocks++;
							studyBlocks[op][blockNum] = [];
							studyBlocks[op][blockNum].push(curVal);
							madeNewArr = true;
						}
						else{
							studyBlocks[op][blockNum].push(curVal);
						}
						postVal = parseInt(time);
						postDay = day;
						if(madeNewArr){
							if(time[time.length - 2] == 3){
								toggle = 70;
							}
							else{
								toggle = 30;
							}
						}
						else{
							if(toggle === 30){
								toggle = 70;
							}
							else{
								toggle = 30;
							}
						}
					});
				}
			}
			var maxBufferHours = totalFreeHours - studyHours;
			readyBufferQuiz(maxBufferHours, numOfBlocks, studyBlocks);
			return true;
		}
	}
	
	/***************************************************************************
	* THIS FUNCTION 
	* maxBufferHours = number of hours free after work sleep & study
	* numOfBlocks = number of free blocks before and after work
	* studyBlocks = an array for each study block in each day. Arrays hold cells
	*               scheduled for study. 
	*
	*
	***************************************************************************/
	function readyBufferQuiz(maxBufferHours, numOfBlocks, studyBlocks){
		document.getElementById("bufferOption").innerHTML = '';
		var maxBufferDensity = 0;
		var numOfBuffers = numOfBlocks * 2;
		if(numOfBuffers <= 0)
			numOfBuffers = 1;
		while(maxBufferDensity * numOfBuffers <= maxBufferHours){
			maxBufferDensity += 0.5; 
		}
		maxBufferDensity -= 0.5;
		var bufferOptions = ['No time','Half hour','One hour','Hour & a half'];
		var counter = 0;
		
		/***********************************************************************
		*    BUFFER SECTION
		***********************************************************************/
		bufferOptions.forEach(function(curVal){
			if(counter <= maxBufferDensity){
				var span = document.createElement('span');
				span.classList.add('op');
				span.classList.add('bufferSet');
				span.innerHTML = curVal;
				span.addEventListener('click',function(){
					/*
						USER CHOSE BUFFER
					*/
					var buffer;
					switch(this.innerHTML){
						case 'No time':
							buffer = 0;
						break;
						case 'Half hour':
							buffer = 1;
						break;
						case 'One hour':
							buffer = 2;
						break;
						case 'Hour &amp; a half':
							buffer = 3;
						break;
					}
					bufferedBlocks = applyBuffer(studyBlocks, buffer);
					document.getElementById('beginBuffer').innerHTML = "&#10004; Buffers";
					bufferQuiz.classList.remove('fadeIn');
					mainMenu.classList.add('fadeIn');
				});
				document.getElementById("bufferOption").appendChild(span);
				counter++;
			}
		});
	
		mainMenu.classList.add('fadeIn');
		document.getElementById('beginStudy').innerHTML = "&#10004; Credits";
	}
	/***********************************************************************
	*    BUFFER SECTION
	***********************************************************************/
	//Opens the buffer quiz
	document.getElementById('beginBuffer').addEventListener('click', function(){
		mainMenu.classList.remove('fadeIn');
		bufferQuiz.classList.add('fadeIn');
	});	
	
	function applyBuffer(blocks, buffer){
		for(day in blocks){
			for(arr in blocks[day]){
				blocks[day][arr].splice(0, buffer);
				for(i = 0; i < buffer; i++){
					blocks[day][arr].splice(-1, 1);
				}
			}
		}
		return blocks;
	}
	
	/***********************************************************************
	*    START TIME SECTION
	***********************************************************************/
	//Opens the start time quiz
	document.getElementById('beginStarter').addEventListener('click', function(){
		mainMenu.classList.remove('fadeIn');
		startTimeQuiz.classList.add('fadeIn');
	});	
	
	var startSet = document.getElementsByClassName('startSet');
	for(starting in startSet){
		if(startSet[starting].style){
			startSet[starting].addEventListener('click', function(){
				var thisInnerHTML = this.innerHTML;
				switch (this.innerHTML){
					case 'Beginning of Week':
						startingTomorrow = false;
						startingToday = false;
						startAtBeginning = true;					
					break;
					case 'Today':
						startingTomorrow = false;
						startingToday = true;
						startAtBeginning = false;					
					break;
					case 'Tomorrow':
						startingTomorrow = true;
						startingToday = false;
						startAtBeginning = false;					
					break;
					default:
						startingTomorrow = false;
						startingToday = false;
						startAtBeginning = true;
				};
				this.style.backgroundColor = 'lightblue';
				
				//turn other backgrounds white
				for(starting in startSet){
					if(startSet[starting].style){
						if(startSet[starting].innerHTML != thisInnerHTML){
							startSet[starting].style.backgroundColor = 'white';
						}
					}
				}
			});
		}
	}
	
	
	var yaStudiedSet = document.getElementsByClassName('alreadyStudiedSet');
	for(ya in yaStudiedSet){
		if(yaStudiedSet[ya].style){
			yaStudiedSet[ya].addEventListener('click', function(){
				hoursAlreadyStudied = parseInt(this.innerHTML);
				startTimeQuiz.classList.remove('fadeIn');
				document.getElementById('finalDataDiv').classList.add('fadeIn');
				//temporary early creation call
				//in future another quiz will open that will then trigger...
				createSchedule(bufferedBlocks, schedule.study.hoursPerWeek);
			});
		}
	}
	
	
	/***************************************************************************
	*THIS FUNCTION Implements the study blocks into the schedule.
	*
	*
	***************************************************************************/
	function createSchedule(blocks, studyHours){
		var scheduledBlockTotal = 0;
		for(day in blocks){
			for(bloc in blocks[day]){
				blocks[day][bloc].forEach(function(curVal){
					var now = new Date;
					var today = now.getDay();
					var day = curVal.classList[0];
					var daySplit = day.split('');
					var letter = daySplit[0].toUpperCase();
					daySplit[0] = letter;
					var dayUpper = daySplit.join('');
					var loopDayNum = days.indexOf(dayUpper);
					var actualDayNum;
					if(today === 0){
						actualDayNum = 6;
					}
					else{
						actualDayNum = today -1;
					}
					var time = curVal.classList[1];
					if(startingToday && actualDayNum <= loopDayNum){
						if(scheduledBlockTotal < (studyHours - hoursAlreadyStudied) * 2){
							curVal.style.backgroundColor = 'blue';
							scheduledBlockTotal++;
						}
						else{
							return 0;
						}						
					}
					else if(startingTomorrow && actualDayNum < loopDayNum){
						if(scheduledBlockTotal < (studyHours - hoursAlreadyStudied) * 2){
							curVal.style.backgroundColor = 'blue';
							scheduledBlockTotal++;
						}
						else{
							return 0;
						}						
					}
					else if(startAtBeginning){
						if(scheduledBlockTotal < (studyHours - hoursAlreadyStudied) * 2){
							curVal.style.backgroundColor = 'blue';
							scheduledBlockTotal++;
						}
						else{
							return 0;
						}
					}
				});
			}
		}
		if(scheduledBlockTotal < (studyHours - hoursAlreadyStudied) * 2){
			document.getElementById('studyMsg').innerHTML = 'There is not enough scheduled time to complete the study hours necessary' +
			'<br />You have ' + scheduledBlockTotal / 2 + ' hours scheduled but need to find time for ' + 
			(((studyHours - hoursAlreadyStudied) * 2) - (scheduledBlockTotal / 2)) +
			' more in order to complete your coursework for this week';
		}
		else{
			document.getElementById('studyMsg').innerHTML = 'You are scheduled for ' +
			scheduledBlockTotal / 2 + ' hours of study';
		}
		
		var wSSD = {};
		wSSD.schedule = schedule;
		wSSD.studyBlocks = blocks;
		ls.setItem('workSleepStudyData',JSON.stringify(wSSD));
		console.log('data stored: ');
		console.log(wSSD);
	}
	
	/***************************************************************************
	*SETUP FUNCTIONS
	***************************************************************************/
	var schedule = {
		
		'work' : null,
		'sleep' : null,
		
		'study' : {
			'hoursPerWeek':0
		}
	}
	
	var studyBlocks = {
		'monday': {
			'start':"",
			'stop':""
		},
		'tuesday': {
			'start':"",
			'stop':""
		},
		'wednesday':{
			'start':"",
			'stop':""
		},
		'thursday':{
			'start':"",
			'stop':""
		},
		'friday':{
			'start':"",
			'stop':""
		},
		'saturday':{
			'start':"",
			'stop':""
		},
		'sunday':{
			'start':"",
			'stop':""
		}
	};
	
	//set up classes in table
	function initCells(){
		var days = ['Monday', 'Tuesday', 'Wednesday', 
			'Thursday', 'Friday', 'Saturday', 'Sunday'];
		var tableRows = document.getElementById('schedTable').children[0].children;
		var numericClass = 0000;
		var toggle = true;
		var first = true;
		for(row in tableRows){
			if(!isNaN(row)){
				var tableDatas = tableRows[row].children;
				if(!first){
					var counter = 0;
					for(dat in tableDatas){
						if(!isNaN(dat)){
							if(!tableDatas[dat].classList.contains('timeLabel')){
								var html = days[counter].toLowerCase();
								counter++
								tableDatas[dat].classList.add(html);
								tableDatas[dat].classList.add(numericClass);
								tableDatas[dat].classList.add('cell');
								tableDatas[dat].setAttribute('data-type','');
							}
						}
					}
					if(toggle){
						numericClass += 30;
						toggle = false;
					}
					else{
						numericClass += 70;
						toggle = true;
					}
				}
				else{
					first = false;
				}
			}
		}
	}
	
	/***************************************************************************
	*OTHER FUNCTIONS
	***************************************************************************/
	function stripTime(start, stop){
		var startAM = (start.indexOf('am') >= 0);
		var stopAM = (stop.indexOf('am') >= 0);
		var startRaw = start.split(':');
		var stopRaw = stop.split(':');
		if(startAM){
			start = startRaw.join('').replace('am','');
			if(start === "1200"){start = "0000"};
			if(start === "1230"){start = "0030"};
		}
		else{
			startRaw[1] = startRaw[1].replace('pm','');
			var num = startRaw[0];
			if(startRaw[0] != 12){
				startRaw[0] = parseInt(num) + 12;
			}
			start = startRaw.join('');
			
		}
		if(stopAM){
			stop = stopRaw.join('').replace('am','');
			if(stop === "1200"){stop = "0000"};
			if(stop === "1230"){stop = "0030"};
		}
		else{
			stopRaw[1] = stopRaw[1].replace('pm','');
			var num = stopRaw[0];
			if(stopRaw[0] != 12){
				stopRaw[0] = parseInt(num) + 12;
			}
			stop = stopRaw.join('');	
		}
		return [start, stop];
	}
}
//END window.onload 

