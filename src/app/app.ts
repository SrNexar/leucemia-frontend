import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  readonly API = 'https://leucemia-backend-production.up.railway.app';
  readonly URL_APP = 'https://leucemia-frontend.onrender.com';

  imagenPreview: string | null = null;
  archivoSeleccionado: File | null = null;
  resultado: any = null;
  cargando = false;
  error: string | null = null;
  qrDataUrl: string = '';
  mostrarQR = false;

  muestras = [
    { clase: 'ALL',    ruta: 'Muestras/ALL.jpg',    color: '#F44336' },
    { clase: 'AML',    ruta: 'Muestras/AML.jpg',    color: '#FF9800' },
    { clase: 'CLL',    ruta: 'Muestras/CLL.jpg',    color: '#2196F3' },
    { clase: 'CML',    ruta: 'Muestras/CML.jpg',    color: '#9C27B0' },
    { clase: 'Normal', ruta: 'Muestras/Normal.jpg', color: '#4CAF50' },
  ];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.generarQR();
  }

  async generarQR() {
    try {
      this.qrDataUrl = await QRCode.toDataURL(this.URL_APP, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1a237e',
          light: '#ffffff'
        }
      });
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error generando QR:', err);
    }
  }

  onImagenSeleccionada(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    this.archivoSeleccionado = archivo;
    this.resultado = null;
    this.error = null;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagenPreview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(archivo);
  }

  async cargarMuestra(ruta: string) {
    this.resultado = null;
    this.error = null;

    const response = await fetch(ruta);
    const blob = await response.blob();
    const nombreArchivo = ruta.split('/').pop() || 'muestra.jpg';
    const archivo = new File([blob], nombreArchivo, { type: blob.type });

    this.archivoSeleccionado = archivo;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagenPreview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(archivo);
  }

  analizar() {
    if (!this.archivoSeleccionado) return;

    this.cargando = true;
    this.error = null;
    this.resultado = null;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('imagen', this.archivoSeleccionado);

    this.http.post(`${this.API}/predecir`, formData).subscribe({
      next: (res: any) => {
        this.resultado = res;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al conectar con el servidor. Intente nuevamente.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleQR() {
    this.mostrarQR = !this.mostrarQR;
  }

  getColorClase(clase: string): string {
    const colores: any = {
      'Normal': '#4CAF50',
      'ALL':    '#F44336',
      'AML':    '#FF9800',
      'CLL':    '#2196F3',
      'CML':    '#9C27B0'
    };
    return colores[clase] || '#333';
  }

  getClases(): string[] {
    return this.resultado ? Object.keys(this.resultado.probabilidades) : [];
  }
}