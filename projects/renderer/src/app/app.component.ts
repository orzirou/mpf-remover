import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  title = 'MPF Remover';

  ngAfterViewInit() {
    const darkmodeDOM = document.getElementById('theme-handler') as HTMLElement;
    const observer = new IntersectionObserver(() => {
      if (getComputedStyle(darkmodeDOM).display === 'block') {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
      }
    });
    observer.observe(darkmodeDOM);
  }
}
