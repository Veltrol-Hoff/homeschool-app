# Curriculum Agent Prompt & System Guide

This document serves as both a reference for the Curriculum system architecture and a prompt template for an AI agent tasked with processing "Instructor's Guides" to generate compatible bulk-import data.

## 1. System Overview
The app manages learning curricula through two main data structures:
- **Curricula**: The parent entity representing a course (e.g., "3rd Grade Math", "Biology 101"). It tracks properties like `subject_id`, `pacing_type` (daily, weekly, self_paced), and `delivery_mode`.
- **Curriculum Items**: The individual tasks, lessons, or assignments within a curriculum. These are ordered sequentially.

When an Instructor's Guide (PDF or image) is scanned, the goal is to extract the weekly/daily plan and convert it into **Curriculum Items** that can be bulk-uploaded into this application via CSV.

---

## 2. CSV Import Schema
The application supports bulk importing curriculum items via CSV. The CSV must have the following headers exactly as written:

| Header | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `sequence_order` | Number | No | The chronological order of the item. If left blank, the system auto-increments. | `1` |
| `day_number` | Number | No | For daily-paced curricula, the specific day this item is scheduled for. | `1` |
| `title` | String | Yes | The title of the lesson or task. | `Chapter 1: Fractions` |
| `item_type` | Enum | Yes | The type of task. Must be one of: `reading`, `worksheet`, `quiz`, `activity`, `video`, `project`, `discussion`, `other`. | `reading` |
| `external_url` | String | No | A link to an external resource or document. | `https://example.com` |
| `estimated_minutes` | Number | No | Estimated time to complete the item. Defaults to 30 if blank. | `45` |

**Example CSV Output:**
```csv
sequence_order,day_number,title,item_type,external_url,estimated_minutes
1,1,Chapter 1 Reading,reading,,30
2,1,Chapter 1 Worksheet,worksheet,,15
3,2,Chapter 2 Reading,reading,,30
4,3,Chapter 1 & 2 Quiz,quiz,,45
```

---

## 3. Agent Instructions (Copy/Paste to AI Agent)

> **Role**: You are an expert educational curriculum parser and planner.
> 
> **Task**: I will provide you with images or text from an "Instructor's Guide" or curriculum syllabus. Your job is to extract the lesson plans, assignments, and reading materials, and format them into a valid CSV that can be imported into my Homeschool application.
> 
> **Instructions**:
> 1. Read the provided Instructor's Guide carefully. Identify the chronological flow of lessons (by week, day, or unit).
> 2. Break down the guide into individual, actionable "Items" (e.g., separating a day's reading from that day's worksheet if they take separate time blocks).
> 3. Assign an appropriate `item_type` to each item. Allowed values: `reading`, `worksheet`, `quiz`, `activity`, `video`, `project`, `discussion`, `other`.
> 4. Estimate the time (`estimated_minutes`) for each task based on typical student pacing.
> 5. If the curriculum explicitly mentions days (e.g., "Week 1, Day 1"), map this to a sequential `day_number`.
> 6. Output the final result *strictly* as a raw CSV code block matching the following headers: `sequence_order,day_number,title,item_type,external_url,estimated_minutes`.
> 
> **Rules**:
> - Do not omit the header row.
> - Ensure all titles are concise but descriptive.
> - If an external URL is mentioned in the text, include it; otherwise leave the column blank.
> - Ensure `sequence_order` increments by 1 for every row.

---

## 4. How to Use This in the App
1. Open your AI assistant (e.g. ChatGPT, Claude, Gemini) and paste the **Agent Instructions** above.
2. Upload the PDF or photos of your Instructor's Guide to the AI.
3. The AI will output a CSV code block.
4. Copy the CSV text, save it as a `.csv` file (or paste it into Excel and save as CSV).
5. In this app, navigate to **Curriculum Library** -> Click **Manage Items** on your curriculum.
6. Under the "Add Items" section, select the **"Bulk Import (CSV)"** tab.
7. Upload your saved `.csv` file and click **Import Items**.
