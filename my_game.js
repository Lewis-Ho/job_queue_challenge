//1. create game
//2. get game data
//3. advance next turn
//4. new machine
//5. assign job to machine
//6. terminate machine


var request = require('request');
var async = require('async');

var host = 'http://job-queue-dev.elasticbeanstalk.com';

var totalJobsFound = 0;
var totalTurns = 50;


////////////////////////////
// Machine list functions //
////////////////////////////

// Sort Machine base in increasing turns for job queue
var sortMachineList = function() {
  machinesList.sort(function(a,b){return a[1].turn_needed - b[1].turn_needed});
  machinesList.reverse();
}


////////////////////////////
//   //
////////////////////////////




// Delete Machine
var deleteMachine = function(game, machine) {
  request.del(
    host + '/games/' + game.id + '/machines' + machine.id,
    function (error, response, body) {
      console.log('DELETED ');
      console.log(JSON.parse(body));
    }
  );
};

// Assign new job to given machine
var assignJobToMachine = function(game, machinesList, givenMachine, newJob) {
  jobIds = [];
  jobIds.push(newJob.id);
  
  request.post(
    host + '/games/' + game.id + '/machines/' + givenMachine.id + '/job_assignments',
    { form: { job_ids: JSON.stringify(jobIds) }  },
    function (error, response, body) {
      async.each(machinesList, function(machine, callback) {
        console.log("Assigned Job " + jobIds + " To machine " + givenMachine.id);
        if (machine.id == givenMachine.id) {
          machine.turn_needed += newJob.turns_required;
          console.log(machine.turn_needed);
          callback();
        }
      });
    }
  );
};

// Create Machine
// Push New Machine to List 
var createMachine = function(game, machinesList, newJob) {
  var machine = {};
  
  request.post(
    host + '/games/' + game.id + '/machines',
    { form: {} },
    function (error, response, body) {
      
      console.log('New Machine Created!');
      console.log(JSON.parse(body));

      machine = {"id":JSON.parse(body).id, "turn_needed": 0}
      machinesList.unshift(machine);
      
      jobIds = [];
      jobIds.push(newJob.id);
  
      request.post(
        host + '/games/' + game.id + '/machines/' + machine.id + '/job_assignments',
        { form: { job_ids: JSON.stringify(jobIds) }  },
        function (error, response, body) {
          console.log("Assigned Job " + jobIds + " To machine " + machine.id);
          machine.turn_needed += newJob.turns_required;
          console.log(machine.turn_needed);
        }
      );
      // Print all machine
      // async.each(machinesList, function(job, callback) {
      //   console.log(machine);
      //   callback();
      // }, function(err){
      //     // if any of the file processing produced an error, err would equal that error
      //     if( err ) {
      //       // One of the iterations produced an error.
      //       // All processing will now stop.
      //       console.log('Error');
      //     } else {
      //       // Assign Jobs
      //       assignJobToMachine(game, machinesList, machine, newJob);
      //     }
      // });
    }
  );
};

// Pull the data for the next turn
var getJob = function(game, machinesList, turn) {
  // AT THE BEGINING OF ADVANCED NEXT TURN
  // CHECK MACHINE LIST, FOR THOSE HAVE NO JOB NEED TO BE TERMINATED
  
  if (turn != undefined ) {
    // For each new turn, update machine list
    if (machinesList.length != 0) {
      async.forEachOf(machinesList, function(machine, key, callback) {
        machine.turn_needed -= 1;
        console.log(machine.turn_needed);
        if ( machine.turn_needed < 1 ) {
          // Delete
          request.del(
            host + '/games/' + game.id + '/machines' + machine.id,
            function (error, response, body) {
              console.log('DELETED ');
              //console.log(JSON.parse(body));
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
      console.log(JSON.parse(body));
      status = JSON.parse(body).status;
      jobList = [];
      
      // First push job to list, then assign job to machine
      // Create same amount of machine as new incoming job number
      JSON.parse(body).jobs.forEach(function(job){
        jobList.push(job);
        console.log("PUSHED");
      });
      

      // game, machinesList, givenMachine, newJob
      // When the status is completed, the game is over.
      if (status != 'completed') {
        // ASSIGN JOBS TO CORESPONING MACHINE
        jobList.forEach(function(job){
          console.log('1 function');
          createMachine(game, machinesList, job);
        });
        
        console.log('2 function');
        getJob(game, machinesList, JSON.parse(body));
          
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
      }
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
      
      // Init machinesList
      var machinesList = [];
      
      //createMachine(JSON.parse(body));
      getJob(JSON.parse(body), machinesList);
    }
  );
};


playGame();
