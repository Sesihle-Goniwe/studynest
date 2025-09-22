import { Component, OnInit } from '@angular/core';
import { StudentCoursesService } from '../../services/student_courses.services';
import { AuthService } from '../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule as C, CommonModule } from '@angular/common';

@Component({
  selector: 'app-matches',
  imports: [FormsModule, CommonModule],
  templateUrl: './matches.html',
  styleUrl: './matches.scss'
})
export class Matches implements OnInit {
  matches: any[] = [];
  matchedPartners: any[] = [];
  likedPartners: any[] = []; // New array for liked partners
  rejectedPartners: any[] = []; // New array for rejected partners
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



    findMatched() {
      if (!this.currentUserId) {
      alert('User not logged in!');
      return;
    }
    
    this.studentCoursesService.getMatches(this.currentUserId).subscribe({
      next: (res) => {
        this.matches = res;
        this.currentIndex = 0;
      },
      error: (err) => console.error(err)
    });
  }

  likeStudent(student: any) {
      if (!this.currentUserId) {
      alert('User not logged in!');
      return;
    }

    this.studentCoursesService.saveMatch(this.currentUserId, student.students.user_id).subscribe({
      next: () => {
        this.nextStudent();
      },
      error: (err) => console.error(err)
    });
  }

  skipStudent(student: any) {
      if (!this.currentUserId) {
      alert('User not logged in!');
      return;
    }

    this.studentCoursesService.skipMatch(this.currentUserId, student.students.user_id).subscribe({
      next: () => {
        this.nextStudent();
      },
      error: (err) => console.error(err)
    });
  }

  nextStudent() {
    this.currentIndex++;
  }

  loadMatchedPartners() {
    if (!this.currentUserId) {
      alert('User not logged in!');
      return;
    }

    this.studentCoursesService.getMatchedPartners(this.currentUserId).subscribe({
      next: (res) => {
        this.matchedPartners = res;
        this.likedPartners = this.matchedPartners.filter(p => p.status === 'liked' || p.status === 'matched');
        this.rejectedPartners = this.matchedPartners.filter(p => p.status === 'rejected');
      },
      error: (err) => console.error(err)
    });
  }

    isFullScreenImageVisible: boolean = false;
  fullScreenImageUrl: string | null = null;
  
  // ... existing constructor and other methods ...

  showFullScreenImage(imageUrl: string) {
    this.fullScreenImageUrl = imageUrl;
    this.isFullScreenImageVisible = true;
  }

  hideFullScreenImage() {
    this.isFullScreenImageVisible = false;
    this.fullScreenImageUrl = null;
  }

  }


