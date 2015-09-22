# job_queue_challenge

For more detail of the game setting/rules/requirements, please visit https://github.com/custora/job_queue_project

To describe the game roughly: 
With given RESTful API, a job queue game can be created and certain actions can be excuted for the created game. 
Challenger need to create an appropriate workflow to the virtual machine to deal with incoming jobs for each turn.
For each job, it requires to assign to a machine with different amount of turns in order to completed it.
There is no upper limit of machine creation but each of them will cost a dollar per turn to operate.
Therefore, the solution needs to be optimize and found the balance between cost and delayed job turns. 

By the end of the game, it will provide the score and money cost for that game.

The purpose of this game is to demonstrate the ability of back-end web development with node.js. 
Since everything is going to run asynchronously, the implementation will need to be able to deal with contral flow problem between each turns.

# Requirements
Node.Js
