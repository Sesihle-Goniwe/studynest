import { Component, OnInit } from '@angular/core';
import { StudentCoursesService } from '../../services/student_courses.services';


@Component({
  selector: 'app-matches',
  imports: [],
  templateUrl: './matches.html',
  styleUrl: './matches.scss'
})
export class Matches implements OnInit {
  matches: any[] = [];
  currentUserId: string = '298c258e-10fd-4cb2-84ab-95e449b6d44e'; // replace with actual logged-in user

  constructor(private studentCoursesService: StudentCoursesService) {}

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches() {
    this.studentCoursesService.getMatches(this.currentUserId)
      .subscribe((data: any) => {
        this.matches = data;
      });
  }

  connect(student: any) {
    // Call backend to record a connection (you’ll need a POST /connections endpoint)
    console.log('Connect with', student);
    this.removeStudentCard(student);
  }

  skip(student: any) {
    console.log('Skipped', student);
    this.removeStudentCard(student);
  }

  removeStudentCard(student: any) {
    this.matches = this.matches.filter(s => s.student_id !== student.student_id);
  }
}
