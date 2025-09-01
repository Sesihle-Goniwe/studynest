import { Component, OnInit } from '@angular/core';
import { StudentCoursesService } from '../../services/student_courses.services';
import { AuthService } from '../auth/auth.service';


@Component({
  selector: 'app-matches',
  imports: [],
  templateUrl: './matches.html',
  styleUrl: './matches.scss'
})
export class Matches implements OnInit {
  matches: any[] = []; 
  currentUserId: string | null = null;
  currentIndex = 0;
  constructor(
    private studentCoursesService: StudentCoursesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    const userId = user?.id;

    if (userId) {
      this.currentUserId = userId;
      this.fetchmatches();
    }
    
  }

  fetchmatches() {
    if(this.currentUserId) {
      
    this.studentCoursesService.getMatchingStudents(this.currentUserId)
      .subscribe((data: any) => {
        this.matches = data;
      });
  }
}

  likeStudent(student: any) {
    if(this.currentUserId){
    this.studentCoursesService.sendMatchDecision(this.currentUserId, student.student_id, true).subscribe();
    this.nextStudent();
  }
}

  skipStudent(student: any) {
    if(this.currentUserId){
    this.studentCoursesService.sendMatchDecision(this.currentUserId, student.student_id, false).subscribe();
    this.nextStudent();
  }
}

  nextStudent() {
    this.currentIndex++; //allows to traverse to next student in the list matches which
                        //returned from the backend
  }

}
