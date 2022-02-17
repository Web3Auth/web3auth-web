import { Component, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import {CHAIN_CONFIG, WEB3AUTH_NETWORK} from '../config'

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css']
})
export class SettingComponent implements OnInit {
  @Output() selectChainEvent = new EventEmitter<string>();
  @Output() selectNetworkEvent = new EventEmitter<string>();

  networks = WEB3AUTH_NETWORK;
  chains = CHAIN_CONFIG;

  constructor() { }

  ngOnInit(): void {
  }

  selectChain(e: Event) {
    const el = e.target as HTMLInputElement;
    this.selectChainEvent.emit(el.value);
  }

  selectNetwork(e: Event) {
    const el = e.target as HTMLInputElement;
    this.selectNetworkEvent.emit(el.value);
  }
}
