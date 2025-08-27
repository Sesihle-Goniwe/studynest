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
  currentUserId: string = '906607d7-4752-45b3-bfd2-ed0f119a61be'; // replace with actual logged-in user
  currentIndex = 0;
  constructor(private studentCoursesService: StudentCoursesService) {}

  ngOnInit(): void {
    this.fetchmatches();
  }

  fetchmatches() {
    this.studentCoursesService.getMatchingStudents(this.currentUserId)
      .subscribe((data: any) => {
        this.matches = data;
      });
  }

  likeStudent(student: any) {
    this.studentCoursesService.sendMatchDecision(this.currentUserId, student.student_id, true).subscribe();
    this.nextStudent();
  }

  skipStudent(student: any) {
    this.studentCoursesService.sendMatchDecision(this.currentUserId, student.student_id, false).subscribe();
    this.nextStudent();
  }

  nextStudent() {
    this.currentIndex++; //allows to traverse to next student in the list matches which
                        //returned from the backend
  }

}
