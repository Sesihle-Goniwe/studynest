import { Component,ElementRef,OnInit, ViewChild } from '@angular/core';
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
    skills :  null | undefined;
    studyPreference : string = "Not specified";
    students : _Student | null=null;
   @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

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
            const formData= new FormData();
            formData.append('course',this.course?? '');
            formData.append('skills',this.skills??'');
            formData.append('studyPreference',this.studyPreference);
            formData.append('year',this.year??'');
              /*
              const updateDto = {
                course: this.course,
                skills:this.skills,
                studyPreference:this.studyPreference,
                year: this.year
          
              };
              */
             const file = this.fileInput.nativeElement.files?.[0];
             if(file)
             {
              formData.append('profileImage',file);
             }
                    this.studentService.updatestudentbyUid(uid,formData)
                    .subscribe(updated=>{
                    this.isEditMode=false;
              });
        }
      }
      
      OnImageClick()
      {
          this.fileInput.nativeElement.click();
      }

      onFileSelected(event:any)
      {
        const file: File = event.target.files[0];
      if (file) 
        {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImage = e.target.result; 
      };
      reader.readAsDataURL(file);

 
    }
      }
}



