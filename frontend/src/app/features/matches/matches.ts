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
  currentIndex = 0;

  newCourse = { course_code: '', course_name: '' };
  courses: any[] = [];        // stores added courses
  showMatches = false;         // flag to show/hide matches

  currentUserId: string | null = null;

  constructor(private studentCoursesService: StudentCoursesService, private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user?.id) {
      this.currentUserId = user.id;
    }
  }

  addCourse() {
    if (!this.newCourse.course_code || !this.newCourse.course_name || !this.currentUserId) return;

    this.studentCoursesService.addStudentCourse(this.currentUserId, this.newCourse)
      .subscribe({
        next: (res) => {
          this.courses.push({ ...this.newCourse });        // update local list
          this.newCourse = { course_code: '', course_name: '' };  // clear form
        },
        error: (err) => console.error(err)
      });
  }

  findMatches() {
    if (!this.currentUserId) {
      alert('User not logged in!');
      return;
    }

    this.studentCoursesService.getMatchingStudents(this.currentUserId)
      .subscribe({
        next: (data: any) => {
          this.matches = data;
          this.currentIndex = 0;
          this.showMatches = true;
        },
        error: (err) => console.error(err)
      });
  }

  likeStudent(student: any) {
    this.currentIndex++;
  }

  skipStudent(student: any) {
    this.currentIndex++;
  }
}

