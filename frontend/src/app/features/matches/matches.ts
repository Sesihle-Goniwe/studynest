import { Component, OnInit } from '@angular/core';
import { StudentCoursesService } from '../../services/student_courses.services';
import { AuthService } from '../auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-matches',
  imports: [FormsModule],
  templateUrl: './matches.html',
  styleUrl: './matches.scss'
})
export class Matches implements OnInit {
  matches: any[] = []; 
  currentUserId: string | null = null;
  currentIndex = 0;

  // For adding courses
  newCourse = { course_code: '', course_name: '' };
  courses: any[] = [];

  constructor(
    private studentCoursesService: StudentCoursesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    const userId = user?.id;

    if (userId) {
      this.currentUserId = userId;
      this.fetchMatches();
    }
  }

  fetchMatches() {
    if (this.currentUserId) {
      this.studentCoursesService.getMatchingStudents(this.currentUserId)
        .subscribe({
          next: (data: any) => {
            this.matches = data;
          },
          error: (err) => console.error('Error fetching matches', err)
        });
    }
  }

  nextStudent() {
    this.currentIndex++; // move to next student
  }

  skipStudent(student: any): void {
  // Example: just increment the index to skip to the next match
  this.currentIndex++;
  }

  likeStudent(student: any): void {
  // Example: handle "liking" a student, then move to next
  console.log('Liked student:', student);
  this.currentIndex++;
}

  // 👉 New addCourse method
addCourse() {
  if (this.newCourse.course_code && this.newCourse.course_name && this.currentUserId) {
    this.studentCoursesService.addStudentCourse(this.currentUserId, this.newCourse)
      .subscribe({
        next: (res) => {
          console.log('Course linked to student ✅', res);
          this.courses.push({ ...this.newCourse }); // update UI
          this.newCourse = { course_code: '', course_name: '' }; // clear form
        },
        error: (err) => console.error('Error adding course ❌', err)
      });
  }
}

}
