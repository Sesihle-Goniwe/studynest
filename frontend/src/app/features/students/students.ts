import { Component, OnInit } from '@angular/core';
import { Students, _Student } from '../../services/students';
@Component({
  selector: 'app-students',
  standalone: true,
  imports: [],
  templateUrl: './students.html',
  styleUrl: './students.scss'
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
