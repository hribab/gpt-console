
// #!/usr/bin/env node

// const repl = require("repl");
// const codescan = require('./learn/codescan/learnFromCodescan');
// const github = require('./learn/github/learnFromGithub');
// const documentation = require('./learn/othersources/learnFromDocumentation');
// const dependencyGraph = require('./learn/ast/dependencyGraph');

// const { exec, spawn } = require("child_process");
// const spinners = require("cli-spinners"); // TODO: use this to show spinner while waiting for response
// const fs = require('fs');
// const path = require('path');
// const functionRegex = /function\s+(\w+)\s*\(/gm;
// const arrowFunctionRegex = /const\s+(\w+)\s*=\s*\((?:\w+(?:,\s*\w+)*)?\)\s*=>/gm;
// const { completer } = require('readline');
// const chalk = require('chalk');
// const prettier = require('prettier');
// var PouchDB = require('pouchdb');
// PouchDB.plugin(require('pouchdb-adapter-memory'));
// const { Client } = require('ssh2');
// const recast = require('recast');
// const { builders } = recast.types;
// const gitignoreToGlob = require('gitignore-to-glob');

// const madge = require('madge');


// const fsextra = require('fs-extra');
// const glob = require('glob');
// const parser = require('@babel/parser');
// const traverse = require('@babel/traverse').default;
// const generator = require('@babel/generator').default;

// const { transformFromAstSync } = require('@babel/core');

// // Create a new SSH connection
// const conn = new Client();

// const { Queue, Worker, QueueEvents } = require('bullmq');

// const { Configuration, OpenAIApi } = require("openai");
// const { setDefaultResultOrder } = require("dns");
// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY 
// });
// const openai = new OpenAIApi(configuration);



// const queue = new Queue('Paint');

// queue.add('cars', { color: 'blue' });

// const childJob = await queue.add('child', { data: 'childData' }, { parentId: [parentJob1.id, parentJob2.id] });
// the child job depends on both parent1 and parent2 jobs and will only be processed after both parent jobs have completed successfully.

// const worker = new Worker('Paint', async job => {
//   if (job.name === 'cars') {
//     console.log("====paint worker===", job.data.color);
//     console.log('Starting job...');
//     await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // wait for 1 minute
//     console.log('Job completed!');
//     return { result: 'success' };
//   }
// });


// async function listActiveJobs(queueName) {
//   const queue = new Queue(queueName);
//   const jobs = await queue.getActive();

//   jobs.forEach(job => {
//     console.log(`Job ID: ${job.id}`);
//     console.log(`Job name: ${job.name}`);
//     console.log(`Job data: ${JSON.stringify(job.data)}`);
//   });
// }

// listActiveJobs('Paint');

// const queueEvents = new QueueEvents('Paint');

// queueEvents.on('completed', ({ jobId }) => {
//   console.log('done painting');
// });

// queueEvents.on(
//   'failed',
//   ({ jobId, failedReason }) => {
//     console.error('error painting', jobId, failedReason);
//   },
// );