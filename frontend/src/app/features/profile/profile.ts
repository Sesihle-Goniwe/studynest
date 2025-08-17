import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { Students, _Student } from '../../services/students';
@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile {

    profileImage : string | null = null;
    displayName : string | null = null;
    email : string | null=null;
    course  : string | null = null;
    university : string | null = null;
    yearOfStudy : null | undefined;
    isEditMode : null | undefined;
    bio : null | undefined;
    skills :  null | undefined;
    studyPreference : string = "undefined";
    ID: string | null = null;

    constructor (private authser: AuthService){}
   
  ngOnInit()
  {
    const user = this.authser.getCurrentUser();
    this.displayName = this.authser.getUserDisplayName();
    /*
    if(user)
    {
        this.ID=user.id;
        const profile = await this.stu.getStudentProfile(this.ID);
        this.university=profile.university;
        this.course=profile.course;
        this.yearOfStudy=profile.year_of_study;
    }
    */

    
  }
      toggleEdit()
      {
        
      }

      saveProfile()
      {}
}
