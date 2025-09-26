import { Component,ElementRef,OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { Students, _Student } from '../../services/students';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone :true,
  imports: [FormsModule,CommonModule],
  templateUrl: './profile.html',
    styleUrls: ['./profile.scss'] 
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
   @ViewChild('fileInput', { static: true }) fileInput!: ElementRef<HTMLInputElement>;

    constructor (private authser: AuthService, private studentService : Students,private http:HttpClient, private route: ActivatedRoute){}
   
ngOnInit() {
  const routeUserId = this.route.snapshot.paramMap.get('userId');
  const user = this.authser.getCurrentUser();

  if (routeUserId) {
    // Fetch the partner's profile
    this.studentService.getStudentByUid(routeUserId).subscribe({
      next: (data: any) => {
        this.students = data;
        this.course = data.course;
        this.skills = data.skills || null;
        this.studyPreference = data.studyPreference || "Not specified";
        this.year = data.year || null;
        this.profileImage = data.profileImage || null;
      }
    });
  } else if (user?.id) {
    // Fetch logged-in user's own profile
    this.displayName = this.authser.getUserDisplayName();
    this.studentService.getStudentByUid(user.id).subscribe({
      next: (data: any) => {
        this.students = data;
        this.course = data.course;
        this.skills = data.skills || null;
        this.studyPreference = data.studyPreference || "Not specified";
        this.year = data.year || null;
        this.profileImage = data.profileImage || null;
      }
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

    uploadPhoto(file: File) 
    {
    const formData = new FormData();
    formData.append('profileImage', file);

    const user = this.authser.getCurrentUser();
    if (!user?.id) return;

    this.studentService.updatestudentPhoto(user.id, formData).subscribe({
      next: updated => {
        this.profileImage = updated.profileImage; 
      },
      error: err => console.error('Failed to upload profile image', err)
    });
  }
      
      OnImageClick()
      {
        
    this.fileInput.nativeElement.click();

      }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    // Preview the image immediately
    const reader = new FileReader();
    reader.onload = e => this.profileImage = e.target?.result as string;
    reader.readAsDataURL(file);

    // Immediately upload and save to DB
    this.uploadPhoto(file);
  }
}



