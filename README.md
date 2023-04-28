# ChatGPT CONSOLE

This is a command line tool that utilizes OpenAI's GPT-4 model to provide text-based interactions.

## Installation

```
yarn global add gpt-console
or 
npm i gpt-console -g

```

## Usage

To run the tool, execute the following command in the root directory or the working directory where you want to use the files

```
gpt-console
```

You will then be presented with a prompt, where you can type your queries and receive responses.

### Commands

The following commands are available:

- `generate-testcases <filename.extension> functionname1 functionname2`: generates test cases for specified functions in the given file.
- `generate-doc <filename.extension> functionname1 functionname2`: generates documentation for specified functions in the given file.
- `codereview <filename.extension>`: provides code review suggestions for the given file.

### Multi-line Commands

To enter 'editor mode', type `.editor` and press enter. You can then enter multi-line code or text. When you're done, press `Ctrl + D` to exit editor mode, and the ChatGPT response will be printed in the console.

For all other commands or text, the ChatGPT response will be printed in the console.

## Examples

### Generate Test Cases

```
generate-testcases index.js fibonacci factorial
```

### Generate Documentation

```
generate-doc index.js fibonacci factorial
```

### Code Review

```
codereview index.js
```

### Multi-line Command

```
.editor
Here's some code I'm working on:

function add(a, b) {
  return a + b;
}

What do you think?
^D
```

## Roadmap

We are constantly working to improve ChatGPT Console and make it more useful for developers. Some of the upcoming features we're working on include:

- Creating a long-running agent that can perform complex tasks.
- Using a combination of system commands and the current repository to streamline workflows.
- Automating tedious and repetitive tasks, such as writing useless documents, that are typically assigned by bosses.