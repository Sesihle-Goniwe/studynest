import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { Students, _Student } from '../../services/students';
@Component({
  selector: 'app-profile',
  standalone :true,
  imports: [FormsModule,CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {

    profileImage : string | null = null;
    displayName : string | null = null;
    email : string | null=null;
    course  : string | null = null;
    university : string | null = null;
    year : null | undefined;
    isEditMode : boolean =false;
    bio : null | undefined;
    skills :  null | undefined;
    studyPreference : string = "Not specified";
    ID: string | null = null;
    students : _Student | null=null;
    constructor (private authser: AuthService, private studentService : Students,private http:HttpClient){}
   
ngOnInit() {
  this.isEditMode=false;
  const user = this.authser.getCurrentUser();
  this.displayName = this.authser.getUserDisplayName();
  const uid = user?.id;
  if(uid)
  {
    this.studentService.getStudentByUid(uid).subscribe({ next: (data: any) => 
      {
      this.students = data;

      //preload

        this.course = data.course;
        this.skills = data.skills || null; // default to null if empty
        this.studyPreference = data.studyPreference || "Not specified";
        this.year = data.year || null;
      },
  });
    
  }
}

  toggleEdit()
      {
        this.isEditMode=!this.isEditMode;
      }

       saveProfile()
      {
          const user = this.authser.getCurrentUser();
          const uid = user?.id;
          if(uid)
          {
              const updateDto = {
                course: this.course,
                skills:this.skills,
                studyPreference:this.studyPreference,
                year: this.year
          
              };
                    this.studentService.updatestudentbyUid(uid,updateDto)
                    .subscribe(updated=>{
                    this.isEditMode=false;
              });
        }
      }    
}



