package com.example.homeschoolapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickAddScreen() {
    // UI State
    var selectedStudent by remember { mutableStateOf("") }
    var selectedSubject by remember { mutableStateOf("") }
    var durationMinutes by remember { mutableStateOf("") }
    var activityNotes by remember { mutableStateOf("") }

    // Dropdown expanded states
    var studentExpanded by remember { mutableStateOf(false) }
    var subjectExpanded by remember { mutableStateOf(false) }

    // Mock data based on GEMINI.txt
    val students = listOf("Child 1", "Child 2")
    val subjects = listOf("Reading", "Language Arts", "Math", "Social Studies", "Science", "Health")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Reverse Logging Quick-Add",
            style = MaterialTheme.typography.headlineMedium
        )

        // Student Selection Dropdown
        ExposedDropdownMenuBox(
            expanded = studentExpanded,
            onExpandedChange = { studentExpanded = !studentExpanded },
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = selectedStudent,
                onValueChange = {},
                readOnly = true,
                label = { Text("Select Student") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = studentExpanded) },
                modifier = Modifier
                    .menuAnchor()
                    .fillMaxWidth()
            )
            ExposedDropdownMenu(
                expanded = studentExpanded,
                onDismissRequest = { studentExpanded = false }
            ) {
                students.forEach { student ->
                    DropdownMenuItem(
                        text = { Text(student) },
                        onClick = {
                            selectedStudent = student
                            studentExpanded = false
                        }
                    )
                }
            }
        }

        // Subject Selection Dropdown
        ExposedDropdownMenuBox(
            expanded = subjectExpanded,
            onExpandedChange = { subjectExpanded = !subjectExpanded },
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = selectedSubject,
                onValueChange = {},
                readOnly = true,
                label = { Text("Select Subject") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = subjectExpanded) },
                modifier = Modifier
                    .menuAnchor()
                    .fillMaxWidth()
            )
            ExposedDropdownMenu(
                expanded = subjectExpanded,
                onDismissRequest = { subjectExpanded = false }
            ) {
                subjects.forEach { subject ->
                    DropdownMenuItem(
                        text = { Text(subject) },
                        onClick = {
                            selectedSubject = subject
                            subjectExpanded = false
                        }
                    )
                }
            }
        }

        // Duration Entry
        OutlinedTextField(
            value = durationMinutes,
            onValueChange = { if (it.all { char -> char.isDigit() }) durationMinutes = it },
            label = { Text("Duration (minutes)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )

        // Activity Notes
        OutlinedTextField(
            value = activityNotes,
            onValueChange = { activityNotes = it },
            label = { Text("Activity Notes") },
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 120.dp),
            minLines = 4
        )

        Spacer(modifier = Modifier.weight(1f))

        // Log Activity Button
        Button(
            onClick = {
                // TODO: Save log to database
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = selectedStudent.isNotEmpty() && selectedSubject.isNotEmpty() && durationMinutes.isNotEmpty()
        ) {
            Text("Log Activity")
        }
    }
}
