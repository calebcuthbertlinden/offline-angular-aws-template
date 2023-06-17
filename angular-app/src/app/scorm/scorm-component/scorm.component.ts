import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-scorm',
  templateUrl: './scorm.component.html',
  styleUrls: ['./scorm.component.css']
})
export class ScormComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

  @Input() src:String = "assets/scorm/scormdriver/indexAPI.html";

}
