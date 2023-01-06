import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'MPF Remover';

  ngOnInit() {
    document.body.classList.add(
      matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark-theme'
        : 'light-theme'
    );
  }
}
