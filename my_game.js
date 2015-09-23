var request = require('request');
var async = require('async');

var host = 'http://job-queue-dev.elasticbeanstalk.com';

// Indicate short or long game
var totalTurns = 50;

// Create New Machine And Assign The Given Job
var createMachine = function(game, machinesList, newJob) {
  var machine = {};
  
  request.post(
    host + '/games/' + game.id + '/machines',
    { form: {} },
    function (error, response, body) {
      machine = {"id":JSON.parse(body).id, "turn_needed": 0}
      machinesList.unshift(machine);
      
      jobIds = [];
      jobIds.push(newJob.id);
  
      request.post(
        host + '/games/' + game.id + '/machines/' + machine.id + '/job_assignments',
        { form: { job_ids: JSON.stringify(jobIds) }  },
        function (error, response, body) {
          machine.turn_needed += newJob.turns_required;
        }
      );
    }
  );
};

// Pull the data for the next turn
var getJob = function(game, machinesList, turn) {
  // Prevent deletion for first turn
  if (turn != undefined ) {
    // For each new turn, update machine list to indicate a turn passed
    if (machinesList.length != 0) {
      async.forEachOf(machinesList, function(machine, key, callback) {
        machine.turn_needed -= 1;
        
        // Delete the machine which done its job
        if ( machine.turn_needed < 1 ) {
          request.del(
            host + '/games/' + game.id + '/machines' + machine.id,
            function (error, response, body) {
              machinesList.splice(key, 1);
            }
          );
        }
      });
    }
  }
  
  request.get(
    host + '/games/' + game.id + '/next_turn',
    function (error, response, body) {
      status = JSON.parse(body).status;
      jobList = [];
      
      // Push all incoming jobs to a list
      JSON.parse(body).jobs.forEach(function(job){
        jobList.push(job);
      });
      
      // When the status is completed, the game is over
      // For each job, a new machine will be created and the job will assign to it
      if (status != 'completed') {
        jobList.forEach(function(job){
          createMachine(game, machinesList, job);
        });
        
        // Advance to next turn
        getJob(game, machinesList, JSON.parse(body));
          
      } else {
        // Print end game result
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
      }
    }
  );
};

// Kick off the game by posting to the new game endpoint
var playGame = function() {
  // Init machinesList
  var machinesList = [];
  
  request.post(
    host + '/games',
    { form: {} },
    // { form: { long: true } },
    function (error, response, body) {
      console.log(JSON.parse(body));
      // To handle long game
      if (JSON.parse(body).short == false) {
        totalTurns = 500;
      }
      getJob(JSON.parse(body), machinesList);
    }
  );
};


playGame();
