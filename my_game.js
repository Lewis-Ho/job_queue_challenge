// .2
// Get Game info
var getTurnInfo = function(game, machine) {
  request.get(
    host + '/games/' + game.id,
    function (error, response, body) {
      //assignJobs(game, machine, JSON.parse(body));
      //nextTurn(JSON.parse(body));
      console.log("Get Current Turn Info : ");
      console.log(JSON.parse(body));
    }
  );
};

//1. create game
//2. get game data
//3. advance next turn
//4. new machine
//5. assign job to machine
//6. terminate machine


var request = require('request');

var host = 'http://job-queue-dev.elasticbeanstalk.com';

var totalJobsFound = 0;
var totalTurns = 50;

// Create Machine
// Push New Machine to List 
var createMachine = function(game, machinesList) {
  // Init setting
  if (machinesList === undefined) {
      machinesList = [];
  }
  var machine = {};
  
  request.post(
    host + '/games/' + game.id + '/machines',
    { form: {} },
    function (error, response, body) {
      console.log('New Machine Created!');
      console.log(JSON.parse(body));
      
      machine = {"id":JSON.parse(body).id, "num_job": 0, "turn_needed": 0}
      machinesList.unshift(machine);
      // Print all machine
      for (var i = 0; i < machinesList.length; i++) {
        console.log(machinesList[i]);
      }
      
      // Assign Jobs
      advanceToNextTurn(game, machinesList);
    }
  );
};

// Delete Machine
var deleteMachine = function(game) {
  request.del(
    host + '/games/' + game.id + '/machines' + machine.id,
    function (error, response, body) {
      // 
    }
  );
};

var assignToNewMachine = function(game, machinesList) {
  request.post(
    host + '/games/' + game.id + '/machines/' + machinesList[0].id + '/job_assignments',
    { form: { job_ids: JSON.stringify(jobIds) }  },
    function (error, response, body) {
      // Change machines list elements
      machinesList[0].num_job += 1;
      machinesList[0].turn_needed += job.turns_required;
      //nextTurn(game);
      console.log(body);
      
      // Finish assigning all jobs, advance to next turn
      console.log('Go to next TURN ========> ');
      advanceToNextTurn(game, machinesList);
    }
  );
};

var assignToMachine = function(game, machinesList) {
  console.log('choice B');
  // Assign jobs to machine with same number of machines, advance to next turn
  request.post(
    host + '/games/' + game.id + '/machines/' + machinesList[0].id + '/job_assignments',
    { form: { job_ids: JSON.stringify(jobIds) } },
    function (error, response, body) {
      //nextTurn(game);
      machinesList[0].num_job += 1;
      machinesList[0].turn_needed += job.turns_required;
      console.log(body);
      
      // Finish assigning all jobs, advance to next turn
      console.log('Go to next TURN ========> ');
      advanceToNextTurn(game, machinesList);
    }
  );
};

////////////////////////////
// Machine list functions //
////////////////////////////

// Sort Machine base in increasing turns for job queue
var sortMachineList = function() {
  machinesList.sort(function(a,b){return a[1].turn_needed - b[1].turn_needed});
  machinesList.reverse();
}

var getAverage = function(machinesList) {
  var average = 0;
  for (var i = 0; i < machinesList.length; i++) {
    average = average + machinesList[i].turn_needed;
  }
  return average;
}

////////////////////////////
//   //
////////////////////////////

// Advance to next turn, get jobs from this state
var advanceToNextTurn = function(game, machinesList) {
  request.get(
    host + '/games/' + game.id + '/next_turn',
    function (error, response, body) {
      assignJob(game, machinesList, JSON.parse(body));
    }
  );
};

// Assign jobs to new machine
var assignJob = function(game, machinesList, turn) {
  status = turn.status;
  totalJobsFound += turn.jobs.length;

  console.log(turn);
  console.log(
    "On turn " + turn.current_turn + " got " + turn.jobs.length + 
    " jobs, having completed " + turn.jobs_completed + " of " + 
    totalJobsFound + " with " + turn.jobs_running + " jobs running, and " +
    turn.jobs_queued + " jobs queued, and " + turn.machines_running + " machines running."
  );

  // When the status is completed, the game is over.
  if (status != 'completed') {

    // Assign each job to the machine which has the shortest job queue
    // If current turn is under 50 (or 500 if it is long game) and
    // average work load for each machine is higher than current machines number then
    // create new machine and assign job to machine.
    // Otherwise, assign job with existed machines without adding new machine.
    // 
    turn.jobs.forEach(function(job) {
      jobIds = [];
      jobIds.push(job.id);
      
      console.log("ASSIGNING In game:" + game.id + ', write jobID ' + JSON.stringify(job.id) + ' TO ' + machinesList[0].id);
      //if ( (turn.current_turn <= totalTurns) && ( getAverage(machinesList) > machinesList.length)) {        
        console.log(turn.current_turn <= totalTurns + ' ' + turn.current_turn);
      if ( (turn.current_turn <= totalTurns) && (turn.current_turn != 1)) {
        console.log('choice A' + machinesList.length);
        //createMachine(game, machinesList);
        var machine = {};
  
        request.post(
          host + '/games/' + game.id + '/machines',
          { form: {} },
          function (error, response, body) {
            console.log('YOU MADE IT!');
            console.log(JSON.parse(body));
      
            machine = {"id":JSON.parse(body).id, "num_job": 0, "turn_needed": 0}
            machinesList.unshift(machine);
            // Print all machine
            for (var i = 0; i < machinesList.length; i++) {
              console.log(machinesList[i]);
            }
          }
        );
        
        request.post(
          host + '/games/' + game.id + '/machines/' + machinesList[0].id + '/job_assignments',
          { form: { job_ids: JSON.stringify(jobIds) }  },
          function (error, response, body) {
            // Change machines list elements
            machinesList[0].num_job += 1;
            machinesList[0].turn_needed += job.turns_required;
            //nextTurn(game);
            console.log(body);
          }
        );
      } else {
        console.log('choice B');
        // Assign jobs to machine with same number of machines, advance to next turn
        request.post(
          host + '/games/' + game.id + '/machines/' + machinesList[0].id + '/job_assignments',
          { form: { job_ids: JSON.stringify(jobIds) } },
          function (error, response, body) {
            //nextTurn(game);
            machinesList[0].num_job += 1;
            machinesList[0].turn_needed += job.turns_required;
            console.log(body);
          }
        );
      } // END CONDITIONAL LOOP
    }); // END JOBS FOREACH LOOP
    
    // Finish assigning all jobs, advance to next turn
    console.log('Go to next TURN ========> ');
    advanceToNextTurn(game, machinesList);
  } else {
    // Print End Game Result
    request.get(
      host + '/games/' + game.id,
      function (error, response, body) {
        console.log(body);
        console.log("\n\n");
        var completedGame = JSON.parse(body);
        console.log("COMPLETED GAME WITH:");
        console.log("Total delay: " + completedGame.delay_turns + " turns"); 
        console.log("Total cost:  $" + completedGame.cost); 
      }
    );
  }// END COMPLETET IF ELSE
};

// var assignJobsWithNewMachine = function(game, machine, turn) {
//   console.log("deleting........................................");
//   request.del(
//     host + '/games/' + game.id + '/machines/' + machine.id,
//     function (error, response, body) {
//       request.post(
//         host + '/games/' + game.id + '/machines',
//         { form: {} },
//         function (error, response, body) {
//           assignJobs(game, JSON.parse(body), turn, true);
//         }
//       );
//     }
//   );
// };

// Pull the data for the next turn
var nextTurn = function(game, machine) {
  request.get(
    host + '/games/' + game.id + '/next_turn',
    function (error, response, body) {
      assignJobs(game, machine, JSON.parse(body));
    }
  );
};

// Kick off the game by posting to the new game endpoint
var playGame = function() {
  request.post(
    host + '/games',
    { form: {} },
    // { form: { long: true } },
    function (error, response, body) {
      console.log(JSON.parse(body));
      // Handle long game
      if (JSON.parse(body).short == false) {
        totalTurns = 500;
      }
      
      createMachine(JSON.parse(body));
    }
  );
};


playGame();
