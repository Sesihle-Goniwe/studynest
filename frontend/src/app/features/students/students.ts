import { Component, OnInit } from '@angular/core';
import { Students, _Student } from '../../services/students';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './students.html',
  styleUrls: ['./students.scss']
})

export class StudentsList implements OnInit {
  students : _Student[]= [];
  constructor (private studentSerive: Students) {}
  
  ngOnInit()
  {
    this.studentSerive.getStudents().subscribe((data : any)=>{
      this.students=data;
    })
  }
  
}
