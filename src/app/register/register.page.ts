import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActionCodeSettings } from "firebase/auth";
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  private registerForm: FormGroup;

  constructor(private fb: FormBuilder, private afAuth: AngularFireAuth, private router: Router) { 
    this.registerForm = this.fb.group({
      mail: ['', [Validators.required, Validators.minLength(3)]],
      mdp: ['', Validators.maxLength(255)],
      mdp2: ['', Validators.maxLength(255)]
    });
  }
  ngOnInit() {
  }

  inscription(){
    if(this.registerForm.value.mdp !== this.registerForm.value.mdp2){
      alert("le mot de passe et la confirmation ne corresponde pas")
    }
    else{
      const res = this.afAuth.createUserWithEmailAndPassword(this.registerForm.value.mail, this.registerForm.value.mdp);
      res.then(data => {
        const mail = data.user.sendEmailVerification();
        mail.then(data => this.router.navigate(['/']));
        mail.catch(data => alert("erreure de l'envoie du mail de vérification"));
       });
      res.catch(error => alert("echec de la création de compte"));
    }
  }

}
