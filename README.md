# Habitica Summoner

Summon your Todoist tasks into Habitica's Todo!

**Habitica Summoner** connects your Todoist and Habitica accounts, automatically sync your Todoist's tasks to your Habitica's account.
Manage all your to-do tasks in Todoist — and get Habitica rewords for them.

## Features

-  Fetches tasks from your Todoist account.
-  Creates matching todos in your Habitica account.
-  Only pushes tasks one-way: Todoist ➔ Habitica.
-  Clean, lightweight, and fully customizable.

## Why Habitica Summoner?

Todoist is powerful for productivity. Habitica is powerful for gamification.  
Habitica Summoner lets you use both at once — keeping Todoist as your task manager while leveling up your Habitica character with no manual copying.

## Setup

This is created to be run on Google Scripts

## Notes

Habitica and Todoist task id field is 'id'
(Task id for completed task in Todoist is different. The completed task and active task are completely different object in Todoiest. When looking at completed tasks, you need to use 'task_id' instead of 'id')
Habitica text = content in Todoist
Habitica notes = description in Todoist
Habitica notes = description in Todoist

Habitica priority = priority in Todoist
Habitica priority field should be named difficulty.
Habitica enum values are:
Trivial = 0.1,
Easy = 1,
Medium = 1.5,
hard = 2
Todoiest is:
p4 = 1
p3 = 2
p2 = 3
p1 = 4

Habitica tasks are linked by storing the Todoist task's id in the notes field in Habitica's task.
