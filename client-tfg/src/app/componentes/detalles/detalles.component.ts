import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormGroup, Validators, FormBuilder, FormControl } from '@angular/forms';
import { HistoriaUsuario } from '../../clases/hu'; // importo la clase HistoriaUsuario
import { HuService } from '../../servicios/hu.service'; // importo el servicio HuService
import { LogicaHuService } from '../../servicios/logica-hu.service';
import { ContadorService } from '../../servicios/contador.service';
import { IteracionService } from '../../servicios/iteracion.service';
import { Iteracion } from '../../clases/iteracion';
import { Validaciones } from '../../validaciones/validaciones';
import { Tareas } from '../../clases/tareas';
@Component({
  selector: 'app-detalles',
  templateUrl: './detalles.component.html',
  styleUrls: ['./detalles.component.css']
})
export class DetallesComponent implements OnInit, OnDestroy {

  @Input() public proyectoID: String;

  errorMessage: any;

  public formulario: FormGroup;
  public formNuevo: FormGroup;

  subscrib: any;
  subscrib1: any;
  subscrib2: any;

  public iteraciones: Iteracion[];
  public hu: HistoriaUsuario = null;
  public huSel: Boolean = false;
  public tipos: String[] = ['Direct', 'Increment', 'Reused'];
  public tareasDeshabilitados: Boolean[] = [true, true, true, true];

  constructor(private fb: FormBuilder,
    private huService: HuService,
    private logicaService: LogicaHuService,
    private contadorService: ContadorService,
    private iteracionService: IteracionService) { }

  ngOnDestroy() {
    this.subscrib.unsubscribe();
    this.subscrib1.unsubscribe();
    this.subscrib2.unsubscribe();
  }

  ngOnInit() {
    this.cargarFormNuevo();
    this.iteracionService.getIteraciones(this.proyectoID).subscribe(iter => {
      this.iteraciones = iter;
    });

    // Actualizamos los detalles del nodo seleccionado
    this.subscrib = this.logicaService.huSel.subscribe((hu) => {
      this.tipos = null;
      if (hu !== undefined) {
          this.huSel = true;
          this.hu = hu;
          this.comboTipo();
          this.cargarFormulario();
      } else {
        this.tipos = ['Direct', 'Increment', 'Reused'];
        this.huSel = false;
        this.cargarFormNuevo();
      }
    });

    // Actualizamos el número de iteraciones que hay al añadir una nueva a la BD
    this.subscrib1 = this.logicaService.detallesIteracion.subscribe((iter) => {
        this.iteraciones.push(iter);
    });
    // Actualizamos el número de iteraciones que hay al eliminar una iteración
    this.subscrib2 = this.logicaService.eliminaIteracion.subscribe((iter) => {
      this.iteraciones.pop();
    });
  }

  cargarFormulario() {
    // Se definen los campos del formulario
    this.formulario = this.fb.group({
      nombre: [this.hu.nombre, Validators.compose([Validators.required])],
      descripcion: [this.hu.descripcion, Validators.compose([Validators.required])],
      iteracion: [this.hu.iteracion, Validators.compose([Validators.required])],
      tipo: [this.hu.tipo, Validators.compose([Validators.required])],
      a1: [this.hu.tareas.a1],
      a2: [this.hu.tareas.a2],
      a3: [this.hu.tareas.a3],
      finalizado: [this.hu.tareas.finalizado]
    });
    this.formulario.setValidators([Validaciones.checkboxes('a1', 'a2', 'a3', 'finalizado')]);
  }

  cargarFormNuevo() {
    // Se definen los campos del formulario
    this.formNuevo = this.fb.group({
      nombre: ['', Validators.compose([Validators.required])],
      descripcion: ['', Validators.compose([Validators.required])],
      iteracion: ['', Validators.compose([Validators.required])],
      tipo: ['', Validators.compose([Validators.required])],
      a1: [{ value: false, disabled: true }],
      a2: [{ value: false, disabled: true }],
      a3: [{ value: false, disabled: true }],
      finalizado: [{ value: false, disabled: true }]
    });
  }

  cambiaHu() {
    Object.assign(this.hu, this.formulario.value);
    this.hu.tareas.a1 = this.formulario.get('a1').value;
    this.hu.tareas.a2 = this.formulario.get('a2').value;
    this.hu.tareas.a3 = this.formulario.get('a3').value;
    this.hu.tareas.finalizado = this.formulario.get('finalizado').value;
    this.huService.updateHu(this.hu._id, this.hu).subscribe(nuevo => {
      this.logicaService.detallesNodoCambio(this.hu);
    });
  }

  creaHu() {
    const iteracion = this.iteraciones.filter(iter => iter.numero.toString() === this.formNuevo.value.iteracion);
    this.contadorService.incrementa();
    this.hu = {
      proyectoID: this.proyectoID,
      nombre: this.formNuevo.value.nombre,
      descripcion: this.formNuevo.value.descripcion,
      tipo: this.formNuevo.value.tipo,
      _id: undefined,
      posX: -250,
      posY: iteracion[0].posY + 20,
      numero: this.contadorService.contador,
      iteracion: this.formNuevo.value.iteracion,
      padres: [],
      tareas: {
        a1: false,
        a2: false,
        a3: false,
        finalizado: false
      }
    };
    this.huService.addHu(this.hu).subscribe(
      response => {
        this.hu = response;
        if (!response) {
          alert('Error en el servidor');
        } else {
          this.logicaService.addHuDetalles(response);
          this.formNuevo.reset();
        }
      },
      error => {
        this.errorMessage = <any>error;
        if (this.errorMessage != null) {
          console.log(this.errorMessage);
        }
      });
  }

  comboTipo() {
    this.huService.getHijos(this.hu._id).subscribe(res => {
      if (this.hu.padres.length === 0 && res.length === 0) {
        this.tipos = ['Direct', 'Increment', 'Reused'];
      } else {
        this.tipos = [this.hu.tipo];
      }
    });
  }

}
