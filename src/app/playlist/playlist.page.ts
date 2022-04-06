import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PlaylistFormComponent } from '../modals/playlist-form/playlist-form.component';
import { Playlist } from '../models/playlist';
import { PlaylistService } from '../services/playlist/playlist.service';
import { switchMap, EMPTY, map, Observable, combineLatest } from 'rxjs';
import { Todo } from '../models/todo';
import { AuthService } from '../services/auth/auth.service';
import { User } from '../models/user';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-playlist',
  templateUrl: 'playlist.page.html',
  styleUrls: ['playlist.page.scss'],
})
export class PlaylistPage implements OnInit, AfterViewInit {

  playlists$: Observable<Playlist[]> = EMPTY;
  topItems: Observable<Todo[]> = EMPTY;
  readonly slideOpt = {
    direction: 'horizontal',
    slidesPerView: 1.25,
    spaceBetween: 1,
    pagination: {
      el: '.swiper-pagination',
    }
  };
  playlistFilterControl: FormControl = new FormControl();
  readonly filtersMap = {
    all: this.allFilter,
    mines: this.minesFilter,
    shared: this.sharedFilter,
  }
  
  
  constructor(
    private playlistService: PlaylistService,
    private authService: AuthService,
    private modalController: ModalController,
    ) {}
    
  readonly currentUser: User = this.authService.user;

  ngOnInit(): void {
    const allPlaylists = this.playlistService.getAll();

    // making filtered lists observable
    this.playlists$ = combineLatest([allPlaylists, this.playlistFilterControl.valueChanges])
      .pipe(map(([playlist, val]) => {
        return playlist.filter(this.filtersMap[val])
      }));
    
    // making top items observable from filtered lists
    this.topItems = this.getTopItems(this.playlists$);
  }

  ngAfterViewInit(): void {
    // initializing value after components are rendered to give combineLatest() a first value
    this.playlistFilterControl.setValue('all');    
  }

  getTopItems(playlists$: Observable<Playlist[]>): Observable<Todo[]> {
    const allTodos: Observable<Todo[]> = playlists$
      .pipe(map(playlists => playlists.map(p => p.todos$)))     // mapping playlists to TODOs lists
      .pipe(switchMap(playlists$ => combineLatest(playlists$)   // Converting to 2D mat of TODOs
        .pipe(map(todoMat => [].concat.apply([], todoMat)))     // flattening 2d mat to 1D
      ));
    return allTodos
      .pipe(map(todos => {
        const boolValues = {true: 1, false: 0};
        const priorityValues = {
          high: 0,
          med: 1,
          low: 2
        }
        todos.sort((a, b) => {
          if (a.completed != b.completed)
            return boolValues[String(a.completed)] - boolValues[String(b.completed)];
          return priorityValues[a.priority] - priorityValues[b.priority];
        });
        return todos;
      }));
  }

  /**
   * trackBy function to track rendered elements, and prevent angular from rendering all elements on change.
   * @param index item index
   * @param item item
   * @returns 
   */
   trackFunction(index: number, item: Todo):string {
    return item.id
  }

  delete(playlist: Playlist) {
    this.playlistService.removePlaylist(playlist);
  }

  async openModal(playlist: Playlist = null): Promise<Partial<Playlist>>  {
    // TODO: complete CreatePlaylistComponent and change logic
    const modal = await this.modalController.create({
      component: PlaylistFormComponent,
      cssClass: 'modal',
      swipeToClose: true, // swipe to close modal
      initialBreakpoint: 0.5,
      breakpoints: [0, 0.5],

      componentProps: {
        playlist: playlist 
      }
    });
    await modal.present();
    return (await (modal.onDidDismiss()))?.data;
  }

  async creatList() {
    const newList = await this.openModal();
    if (newList) {
      this.playlistService.addPlaylist(newList as Playlist).then(console.log);
      // TODO: navigate to playlist page
    }
  }

  /****** filter functions ******/

  allFilter(playlist: Playlist): boolean {
    return true;
  }

  minesFilter(playlist: Playlist): boolean {
    return playlist.myRole === 7;
  }

  sharedFilter(playlist: Playlist): boolean {
    return playlist.myRole != 7;
  }

}
