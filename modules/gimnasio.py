import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
from datetime import date, datetime
import os
import json
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import matplotlib.pyplot as plt
from matplotlib.dates import DateFormatter
from styles import Styles
import calendar
from tkcalendar import Calendar

class GimnasioApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Registro de Entrenamientos")
        self.root.geometry("1200x800")
        
        
        
        # Aplicar estilos
        Styles.apply_styles()
        Styles.apply_window_style(root)
        
        # Variables de control
        self.fecha_actual = tk.StringVar(value=date.today().strftime("%Y-%m-%d"))
        self.tipo_entrenamiento = tk.StringVar()
        self.semana_actual = tk.IntVar(value=1)
        self.ejercicio_actual = tk.StringVar()
        self.series = tk.StringVar(value="3")
        self.repeticiones = tk.StringVar(value="10")
        self.peso = tk.StringVar(value="0")
        self.observaciones = tk.StringVar()
        # Nuevas variables para control de peso
        self.peso_actual = tk.StringVar(value="70")
        self.altura = tk.StringVar(value="170")
        self.edad = tk.StringVar(value="30")
        self.sexo = tk.StringVar(value="Hombre")
        self.nivel_actividad = tk.StringVar(value="Sedentario")
        self.objetivo = tk.StringVar(value="Mantenimiento")
        self.calorias_diarias = tk.StringVar()
        
            # Niveles de actividad para Harris-Benedict
        self.factores_actividad = {
            "Sedentario": 1.2,
            "Ligero (1-3 días/semana)": 1.375,
            "Moderado (3-5 días/semana)": 1.55,
            "Activo (6-7 días/semana)": 1.725,
            "Muy activo (2x día)": 1.9
        }

        # Factores de objetivo
        self.factores_objetivo = {
            "Deficit (-500 kcal)": -500,
            "Deficit leve (-250 kcal)": -250,
            "Mantenimiento": 0,
            "Superávit (+250 kcal)": 250,
            "Superávit (+500 kcal)": 500
        }
        
        # Cargar ejercicios predefinidos
        self.ejercicios_predefinidos = self.cargar_ejercicios_predefinidos()
        self.tipo_entrenamiento.set(next(iter(self.ejercicios_predefinidos.keys())))
        
        # Crear estructura de directorios
        self.inicializar_estructura()
        
        # Crear menú principal
        self.crear_menu_principal()
        
        # Inicializar con la vista de registro de entrenamiento
        self.mostrar_registro_entrenamiento()

    def crear_menu_principal(self):
        """Crea el menú principal de la aplicación"""
        menu_frame = ttk.Frame(self.root, style="Custom.TFrame")
        menu_frame.pack(fill="x", padx=20, pady=10)
        
        ttk.Button(
            menu_frame,
            text="🏋️ Registrar Entrenamiento",
            style="Accent.TButton",
            command=self.mostrar_registro_entrenamiento
        ).pack(side="left", padx=5, ipadx=10, ipady=5)
        
        ttk.Button(
            menu_frame,
            text="📅 Historial de Entrenamientos",
            style="Custom.TButton",
            command=self.mostrar_historial
        ).pack(side="left", padx=5, ipadx=10, ipady=5)
        
        ttk.Button(
            menu_frame,
            text="📈 Gráfica de Avance",
            style="Custom.TButton",
            command=self.mostrar_grafica_avance
        ).pack(side="left", padx=5, ipadx=10, ipady=5)
        
        ttk.Button(
            menu_frame,
            text="⚖️ Control de Peso",
            style="Custom.TButton",
            command=self.mostrar_control_peso
        ).pack(side="left", padx=5, ipadx=10, ipady=5)

    def mostrar_registro_entrenamiento(self):
        """Muestra la interfaz para registrar entrenamientos"""
        # Limpiar el contenido principal si existe
        if hasattr(self, 'main_content'):
            self.main_content.destroy()
        
        self.main_content = ttk.Frame(self.root, style="Custom.TFrame")
        self.main_content.pack(expand=True, fill="both", padx=20, pady=(0, 20))
        
        # Construir interfaz de registro
        self.construir_interfaz_registro()

    def mostrar_historial(self):
        """Muestra el historial de entrenamientos en un calendario"""
        # Limpiar el contenido principal si existe
        if hasattr(self, 'main_content'):
            self.main_content.destroy()
        
        self.main_content = ttk.Frame(self.root, style="Custom.TFrame")
        self.main_content.pack(expand=True, fill="both", padx=20, pady=(0, 20))
        
        # Frame para el calendario y detalles
        historial_frame = ttk.Frame(self.main_content, style="Custom.TFrame")
        historial_frame.pack(expand=True, fill="both")
        
        # Calendario
        cal_frame = ttk.LabelFrame(historial_frame, text="Calendario de Entrenamientos", style="Custom.TLabelframe")
        cal_frame.pack(side="left", fill="both", expand=True, padx=5, pady=5)
        
        self.cal = Calendar(
            cal_frame,
            selectmode="day",
            date_pattern="yyyy-mm-dd",
            background=Styles.COLOR_BACKGROUND,
            foreground=Styles.COLOR_TEXT,
            selectbackground=Styles.COLOR_PRIMARY,
            normalbackground=Styles.COLOR_BACKGROUND,
            weekendbackground=Styles.COLOR_BACKGROUND,
            headersbackground=Styles.COLOR_SECONDARY,
            bordercolor=Styles.COLOR_SECONDARY,
            showweeknumbers=False
        )
        self.cal.pack(expand=True, fill="both", padx=10, pady=10)
        self.cal.bind("<<CalendarSelected>>", self.mostrar_detalle_entrenamiento)
        
        # Resaltar días con entrenamientos
        self.resaltar_dias_con_entrenamientos()
        
        # Detalles del entrenamiento seleccionado
        detalle_frame = ttk.LabelFrame(historial_frame, text="Detalle del Entrenamiento", style="Custom.TLabelframe")
        detalle_frame.pack(side="right", fill="both", expand=True, padx=5, pady=5)
        
        self.detalle_text = scrolledtext.ScrolledText(
            detalle_frame,
            wrap=tk.WORD,
            font=Styles.FONT,
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            padx=10,
            pady=10,
            state="disabled"
        )
        self.detalle_text.pack(expand=True, fill="both")

    # def resaltar_dias_con_entrenamientos(self):
    #     """Resalta los días que tienen entrenamientos registrados"""
    #     entrenamientos = self.cargar_todos_entrenamientos()
    #     for fecha_str in entrenamientos.keys():
    #         try:
    #             fecha = datetime.strptime(fecha_str.split('_')[0], "%Y-%m-%d").date()
    #             self.cal.calevent_create(fecha, 'Entrenamiento', 'entrenamiento')
    #         except:
    #             continue
        
    #     self.cal.tag_config('entrenamiento', background=Styles.COLOR_ACCENT)

    def resaltar_dias_con_entrenamientos(self):
        """Resalta los días que tienen entrenamientos o registros de peso"""
        # Resaltar entrenamientos
        entrenamientos = self.cargar_todos_entrenamientos()
        for fecha_str in entrenamientos.keys():
            try:
                fecha = datetime.strptime(fecha_str.split('_')[0], "%Y-%m-%d").date()
                self.cal.calevent_create(fecha, 'Entrenamiento', 'entrenamiento')
            except:
                continue
            
        self.cal.tag_config('entrenamiento', background=Styles.COLOR_ACCENT)

        # Resaltar registros de peso
        ruta_gimnasio = os.path.join("Registros", "Gimnasio")
        if os.path.exists(ruta_gimnasio):
            for archivo in os.listdir(ruta_gimnasio):
                if archivo.startswith("peso_") and archivo.endswith(".json"):
                    try:
                        fecha_str = archivo[5:-5]  # Extrae la fecha de "peso_YYYY-MM-DD.json"
                        fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
                        self.cal.calevent_create(fecha, 'Registro Peso', 'peso')
                    except:
                        continue
                    
        self.cal.tag_config('peso', background="#4CAF50")  # Verde para registros de peso


    # def mostrar_detalle_entrenamiento(self, event=None):
    #     """Muestra el detalle del entrenamiento seleccionado en el calendario"""
    #     fecha_seleccionada = self.cal.get_date()
    #     entrenamientos = self.cargar_todos_entrenamientos()
        
    #     # Buscar entrenamiento para la fecha seleccionada
    #     entrenamiento = None
    #     for fecha_str, datos in entrenamientos.items():
    #         if fecha_str.startswith(fecha_seleccionada):
    #             entrenamiento = datos
    #             break
        
    #     self.detalle_text.config(state="normal")
    #     self.detalle_text.delete("1.0", tk.END)
        
    #     if entrenamiento:
    #         # Mostrar información del entrenamiento
    #         self.detalle_text.insert(tk.END, f"Fecha: {entrenamiento['fecha']}\n", "header")
    #         self.detalle_text.insert(tk.END, f"Tipo: {entrenamiento['tipo']}\n", "header")
    #         self.detalle_text.insert(tk.END, f"Semana: {entrenamiento['semana']}\n\n", "header")
            
    #         self.detalle_text.insert(tk.END, "Ejercicios:\n", "subheader")
    #         for ejercicio in entrenamiento['ejercicios']:
    #             self.detalle_text.insert(tk.END, 
    #                 f"• {ejercicio['ejercicio']}: {ejercicio['series']}x{ejercicio['repeticiones']} "
    #                 f"con {ejercicio['peso']} kg - {ejercicio['observaciones']}\n")
            
    #         if 'recomendaciones' in entrenamiento and entrenamiento['recomendaciones'].strip():
    #             self.detalle_text.insert(tk.END, "\nRecomendaciones:\n", "subheader")
    #             self.detalle_text.insert(tk.END, entrenamiento['recomendaciones'])
    #     else:
    #         self.detalle_text.insert(tk.END, f"No hay entrenamientos registrados para {fecha_seleccionada}", "info")
        
    #     self.detalle_text.tag_config("header", font=(Styles.FONT_FAMILY, 12, "bold"))
    #     self.detalle_text.tag_config("subheader", font=(Styles.FONT_FAMILY, 10, "bold"))
    #     self.detalle_text.tag_config("info", foreground="#555555")
    #     self.detalle_text.config(state="disabled")

    def mostrar_detalle_entrenamiento(self, event=None):
        """Muestra el detalle del entrenamiento y peso seleccionado en el calendario"""
        fecha_seleccionada = self.cal.get_date()

        self.detalle_text.config(state="normal")
        self.detalle_text.delete("1.0", tk.END)

        # Verificar si hay registro de peso para esta fecha
        ruta_peso = os.path.join("Registros", "Peso", f"peso_{fecha_seleccionada}.json")
        registro_peso = None
        if os.path.exists(ruta_peso):
            with open(ruta_peso, "r", encoding="utf-8") as f:
                registro_peso = json.load(f)

        # Buscar entrenamiento para la fecha seleccionada
        entrenamientos = self.cargar_todos_entrenamientos()
        entrenamiento = None
        for fecha_str, datos in entrenamientos.items():
            if fecha_str.startswith(fecha_seleccionada):
                entrenamiento = datos
                break
            
        # Mostrar información del peso si existe
        if registro_peso:
            self.detalle_text.insert(tk.END, "📊 DATOS CORPORALES\n\n", "header")
            self.detalle_text.insert(tk.END, f"⚖️ Peso: {registro_peso['peso']} kg\n", "bold")
            self.detalle_text.insert(tk.END, f"📏 Altura: {registro_peso['altura']} cm\n")
            self.detalle_text.insert(tk.END, f"🔥 GET: {registro_peso['calorias_diarias']} kcal/día\n")
            self.detalle_text.insert(tk.END, f"🏃 Actividad: {registro_peso['nivel_actividad']}\n")
            self.detalle_text.insert(tk.END, f"🎯 Objetivo: {registro_peso['objetivo']}\n\n", "section_end")

        # Mostrar información del entrenamiento si existe
        if entrenamiento:
            self.detalle_text.insert(tk.END, "🏋️ ENTRENAMIENTO\n\n", "header")
            self.detalle_text.insert(tk.END, f"Tipo: {entrenamiento['tipo']}\n")
            self.detalle_text.insert(tk.END, f"Semana: {entrenamiento['semana']}\n\n")

            self.detalle_text.insert(tk.END, "Ejercicios:\n", "subheader")
            for ejercicio in entrenamiento['ejercicios']:
                self.detalle_text.insert(tk.END, 
                    f"• {ejercicio['ejercicio']}: {ejercicio['series']}x{ejercicio['repeticiones']} "
                    f"con {ejercicio['peso']} kg - {ejercicio['observaciones']}\n")

            if 'recomendaciones' in entrenamiento and entrenamiento['recomendaciones'].strip():
                self.detalle_text.insert(tk.END, "\nRecomendaciones:\n", "subheader")
                self.detalle_text.insert(tk.END, entrenamiento['recomendaciones'])

        # Si no hay nada para mostrar
        if not registro_peso and not entrenamiento:
            self.detalle_text.insert(tk.END, f"No hay registros para {fecha_seleccionada}", "info")

        # Configurar formatos de texto
        self.detalle_text.tag_config("header", 
                                   font=(Styles.FONT_FAMILY, 12, "bold"), 
                                   foreground=Styles.COLOR_PRIMARY)
        self.detalle_text.tag_config("subheader", 
                                   font=(Styles.FONT_FAMILY, 10, "bold"))
        self.detalle_text.tag_config("bold", 
                                   font=(Styles.FONT_FAMILY, 10, "bold"))
        self.detalle_text.tag_config("section_end", 
                                   spacing1=10, spacing3=10)
        self.detalle_text.tag_config("info", 
                                   foreground="#555555")

        self.detalle_text.config(state="disabled")
        
    def mostrar_grafica_avance(self):
        """Muestra gráficas de avance separadas para el ejercicio y el peso corporal."""
        # Limpiar el contenido principal si existe
        if hasattr(self, 'main_content'):
            self.main_content.destroy()
        
        self.main_content = ttk.Frame(self.root, style="Custom.TFrame")
        self.main_content.pack(expand=True, fill="both", padx=20, pady=(0, 20))
        
        # Frame para controles
        controles_frame = ttk.Frame(self.main_content, style="Custom.TFrame")
        controles_frame.pack(fill="x", pady=10)
        
        ttk.Label(controles_frame, text="Ejercicio:", style="Custom.TLabel").pack(side="left", padx=5)
        
        # Obtener lista de todos los ejercicios registrados
        ejercicios = self.obtener_lista_ejercicios()
        self.ejercicio_grafica = tk.StringVar()
        
        ejercicio_combo = ttk.Combobox(
            controles_frame,
            textvariable=self.ejercicio_grafica,
            values=ejercicios,
            state="readonly",
            style="Custom.TCombobox",
            width=30
        )
        ejercicio_combo.pack(side="left", padx=5)
        
        if ejercicios:
            self.ejercicio_grafica.set(ejercicios[0])
        
        ttk.Button(
            controles_frame,
            text="Mostrar Gráfica",
            style="Accent.TButton",
            command=self.actualizar_graficas
        ).pack(side="left", padx=10)
        
        # Crear contenedores para gráficas
        self.grafica_ejercicio_frame = ttk.Frame(self.main_content, style="Custom.TFrame")
        self.grafica_ejercicio_frame.pack(expand=True, fill="both", side="left", padx=10)
    
        self.grafica_peso_frame = ttk.Frame(self.main_content, style="Custom.TFrame")
        self.grafica_peso_frame.pack(expand=True, fill="both", side="right", padx=10)
    
        # Inicializar gráficas vacías
        self.fig_ejercicio, self.ax_ejercicio = plt.subplots(figsize=(6, 4))
        self.canvas_ejercicio = FigureCanvasTkAgg(self.fig_ejercicio, master=self.grafica_ejercicio_frame)
        self.canvas_ejercicio.get_tk_widget().pack(expand=True, fill="both")
    
        self.fig_peso, self.ax_peso = plt.subplots(figsize=(6, 4))
        self.canvas_peso = FigureCanvasTkAgg(self.fig_peso, master=self.grafica_peso_frame)
        self.canvas_peso.get_tk_widget().pack(expand=True, fill="both")
    
        # Mostrar gráfica inicial si hay ejercicios
        if ejercicios:
            self.actualizar_graficas()
    
    def actualizar_graficas(self):
        """Actualiza las gráficas de ejercicios y peso corporal."""
        ejercicio = self.ejercicio_grafica.get()
        if not ejercicio:
            return
    
        # Obtener datos del ejercicio
        datos_ejercicio = self.obtener_datos_ejercicio(ejercicio)
        if not datos_ejercicio:
            messagebox.showinfo("Información", f"No hay datos históricos para {ejercicio}")
            return
    
        # Obtener datos de peso corporal
        datos_peso = self.obtener_datos_peso()
    
        # Actualizar gráfica del ejercicio
        self.ax_ejercicio.clear()
        fechas_ejercicio = [datetime.strptime(d['fecha'], "%Y-%m-%d") for d in datos_ejercicio]
        pesos_ejercicio = [float(d['peso']) for d in datos_ejercicio]
        self.ax_ejercicio.plot(fechas_ejercicio, pesos_ejercicio, 'o-', color=Styles.COLOR_PRIMARY)
        self.ax_ejercicio.set_title(f"Peso levantado en {ejercicio}", color=Styles.COLOR_TEXT)
        self.ax_ejercicio.set_xlabel("Fecha")
        self.ax_ejercicio.set_ylabel("Peso (kg)", color=Styles.COLOR_PRIMARY)
        self.fig_ejercicio.autofmt_xdate()
        self.canvas_ejercicio.draw()
    
        # Actualizar gráfica del peso corporal
        self.ax_peso.clear()
        if datos_peso:
            fechas_peso = [datetime.strptime(d['fecha'], "%Y-%m-%d") for d in datos_peso]
            pesos_corporales = [float(d['peso']) for d in datos_peso]
            self.ax_peso.plot(fechas_peso, pesos_corporales, 's-', color=Styles.COLOR_ACCENT)
        self.ax_peso.set_title("Peso Corporal", color=Styles.COLOR_TEXT)
        self.ax_peso.set_xlabel("Fecha")
        self.ax_peso.set_ylabel("Peso Corporal (kg)", color=Styles.COLOR_ACCENT)
        self.fig_peso.autofmt_xdate()
        self.canvas_peso.draw()


    # def mostrar_grafica_avance(self):
    #     """Muestra gráficas de avance para los ejercicios"""
    #     # Limpiar el contenido principal si existe
    #     if hasattr(self, 'main_content'):
    #         self.main_content.destroy()
        
    #     self.main_content = ttk.Frame(self.root, style="Custom.TFrame")
    #     self.main_content.pack(expand=True, fill="both", padx=20, pady=(0, 20))
        
    #     # Frame para controles
    #     controles_frame = ttk.Frame(self.main_content, style="Custom.TFrame")
    #     controles_frame.pack(fill="x", pady=10)
        
    #     ttk.Label(controles_frame, text="Ejercicio:", style="Custom.TLabel").pack(side="left", padx=5)
        
    #     # Obtener lista de todos los ejercicios registrados
    #     ejercicios = self.obtener_lista_ejercicios()
    #     self.ejercicio_grafica = tk.StringVar()
        
    #     ejercicio_combo = ttk.Combobox(
    #         controles_frame,
    #         textvariable=self.ejercicio_grafica,
    #         values=ejercicios,
    #         state="readonly",
    #         style="Custom.TCombobox",
    #         width=30
    #     )
    #     ejercicio_combo.pack(side="left", padx=5)
        
    #     if ejercicios:
    #         self.ejercicio_grafica.set(ejercicios[0])
        
    #     ttk.Button(
    #         controles_frame,
    #         text="Mostrar Gráfica",
    #         style="Accent.TButton",
    #         command=self.actualizar_grafica
    #     ).pack(side="left", padx=10)
        
    #     # Frame para la gráfica
    #     grafica_frame = ttk.Frame(self.main_content, style="Custom.TFrame")
    #     grafica_frame.pack(expand=True, fill="both")
        
    #     # Crear figura de matplotlib
    #     self.fig, self.ax = plt.subplots(figsize=(10, 6), facecolor=Styles.COLOR_BACKGROUND)
    #     self.fig.patch.set_facecolor(Styles.COLOR_BACKGROUND)
    #     self.ax.set_facecolor(Styles.COLOR_BACKGROUND)
        
    #     for spine in self.ax.spines.values():
    #         spine.set_edgecolor(Styles.COLOR_TEXT)
        
    #     self.ax.tick_params(axis='x', colors=Styles.COLOR_TEXT)
    #     self.ax.tick_params(axis='y', colors=Styles.COLOR_TEXT)
    #     self.ax.yaxis.label.set_color(Styles.COLOR_TEXT)
    #     self.ax.xaxis.label.set_color(Styles.COLOR_TEXT)
    #     self.ax.title.set_color(Styles.COLOR_TEXT)
        
    #     # Canvas para la gráfica
    #     self.canvas = FigureCanvasTkAgg(self.fig, master=grafica_frame)
    #     self.canvas.get_tk_widget().pack(expand=True, fill="both")
        
    #     # Mostrar gráfica inicial si hay ejercicios
    #     if ejercicios:
    #         self.actualizar_grafica()

    # def actualizar_grafica(self):
    #     """Actualiza la gráfica con los datos del ejercicio y peso corporal"""
    #     ejercicio = self.ejercicio_grafica.get()
    #     if not ejercicio:
    #         return

    #     # Obtener datos históricos del ejercicio
    #     datos_ejercicio = self.obtener_datos_ejercicio(ejercicio)
    #     if not datos_ejercicio:
    #         messagebox.showinfo("Información", f"No hay datos históricos para {ejercicio}")
    #         return

    #     # Obtener datos de peso corporal
    #     datos_peso = self.obtener_datos_peso()

    #     # Limpiar gráfica
    #     self.ax.clear()

    #     # Preparar datos del ejercicio
    #     fechas_ejercicio = [datetime.strptime(d['fecha'], "%Y-%m-%d") for d in datos_ejercicio]
    #     pesos_ejercicio = [float(d['peso']) for d in datos_ejercicio]
    #     repeticiones = [int(d['repeticiones']) for d in datos_ejercicio]
    #     series = [int(d['series']) for d in datos_ejercicio]
    #     volumen = [s * r * p for s, r, p in zip(series, repeticiones, pesos_ejercicio)]

    #     # Gráfica de peso del ejercicio (peso levantado)
    #     self.ax.plot(fechas_ejercicio, pesos_ejercicio, 'o-', 
    #                 color=Styles.COLOR_PRIMARY, 
    #                 label=f"Peso en {ejercicio} (kg)")

    #     # Gráfica de volumen (series * reps * peso)
    #     self.ax2 = self.ax.twinx()
    #     self.ax2.plot(fechas_ejercicio, volumen, 's--', 
    #                  color=Styles.COLOR_ACCENT, 
    #                  label=f"Volumen en {ejercicio} (kg)")

    #     # Si hay datos de peso corporal, añadirlos a la gráfica
    #     if datos_peso:
    #         fechas_peso = [datetime.strptime(d['fecha'], "%Y-%m-%d") for d in datos_peso]
    #         pesos_corporales = [float(d['peso']) for d in datos_peso]

    #         # Normalizar pesos para que aparezcan en la misma escala
    #         max_peso_ejercicio = max(pesos_ejercicio) if pesos_ejercicio else 1
    #         max_peso_corporal = max(pesos_corporales) if pesos_corporales else 1
    #         factor_escala = max_peso_ejercicio / max_peso_corporal

    #         pesos_corporales_escalados = [p * factor_escala for p in pesos_corporales]

    #         self.ax.plot(fechas_peso, pesos_corporales_escalados, '^-', 
    #                     color="#4CAF50",  # Verde
    #                     label=f"Peso corporal (x{factor_escala:.2f})")

    #     # Configurar ejes y formato
    #     self.ax.set_title(f"Progreso en {ejercicio} y peso corporal", color=Styles.COLOR_TEXT)
    #     self.ax.set_xlabel("Fecha")
    #     self.ax.set_ylabel("Peso levantado (kg)", color=Styles.COLOR_PRIMARY)
    #     self.ax2.set_ylabel("Volumen (kg)", color=Styles.COLOR_ACCENT)

    #     # Formato de fechas
    #     date_format = DateFormatter("%Y-%m-%d")
    #     self.ax.xaxis.set_major_formatter(date_format)
    #     self.fig.autofmt_xdate()

    #     # Leyenda combinada
    #     lines, labels = self.ax.get_legend_handles_labels()
    #     lines2, labels2 = self.ax2.get_legend_handles_labels()
    #     self.ax.legend(lines + lines2, labels + labels2, loc="upper left")

    #     # Configurar colores de ejes
    #     self.ax.tick_params(axis='x', colors=Styles.COLOR_TEXT)
    #     self.ax.tick_params(axis='y', colors=Styles.COLOR_PRIMARY)
    #     self.ax.yaxis.label.set_color(Styles.COLOR_PRIMARY)
    #     self.ax2.tick_params(axis='y', colors=Styles.COLOR_ACCENT)
    #     self.ax2.yaxis.label.set_color(Styles.COLOR_ACCENT)

    #     # Actualizar canvas
    #     self.canvas.draw()

    def obtener_lista_ejercicios(self):
        """Obtiene una lista de todos los ejercicios registrados"""
        entrenamientos = self.cargar_todos_entrenamientos()
        ejercicios = set()
        
        for entrenamiento in entrenamientos.values():
            for ejercicio in entrenamiento['ejercicios']:
                ejercicios.add(ejercicio['ejercicio'])
        
        return sorted(ejercicios)

    def obtener_datos_ejercicio(self, ejercicio):
        """Obtiene los datos históricos de un ejercicio específico"""
        entrenamientos = self.cargar_todos_entrenamientos()
        datos = []
        
        for fecha, entrenamiento in entrenamientos.items():
            fecha_str = fecha.split('_')[0]
            for ej in entrenamiento['ejercicios']:
                if ej['ejercicio'] == ejercicio:
                    datos.append({
                        'fecha': fecha_str,
                        'peso': ej['peso'],
                        'repeticiones': ej['repeticiones'],
                        'series': ej['series']
                    })
                    break
        
        # Ordenar por fecha
        datos.sort(key=lambda x: datetime.strptime(x['fecha'], "%Y-%m-%d"))
        return datos

    def cargar_todos_entrenamientos(self):
        """Carga todos los entrenamientos guardados"""
        entrenamientos = {}
        ruta_gimnasio = os.path.join("Registros", "Gimnasio")
        
        if os.path.exists(ruta_gimnasio):
            for archivo in os.listdir(ruta_gimnasio):
                if archivo.endswith(".json"):
                    try:
                        with open(os.path.join(ruta_gimnasio, archivo), "r", encoding="utf-8") as f:
                            datos = json.load(f)
                            nombre_base = os.path.splitext(archivo)[0]
                            entrenamientos[nombre_base] = datos
                    except:
                        continue
        
        return entrenamientos

    def construir_interfaz_registro(self):
        """Construye la interfaz para registrar entrenamientos"""
        # Frame principal
        registro_frame = ttk.Frame(self.main_content, style="Custom.TFrame")
        registro_frame.pack(expand=True, fill="both")
        
        # Encabezado
        self.crear_encabezado(registro_frame)
        
        # Sección de ejercicios
        self.crear_seccion_ejercicios(registro_frame)
        
        # Sección de recomendaciones
        self.crear_seccion_recomendaciones(registro_frame)
        
        # Botones de acción
        self.crear_botones_accion(registro_frame)

    # Los siguientes métodos son los mismos que en tu implementación original,
    # solo que ahora reciben el frame padre como parámetro
    
    def crear_encabezado(self, parent):
        """Crea el encabezado con los controles principales"""
        encabezado_frame = ttk.LabelFrame(parent, text="Datos del Entrenamiento", style="Custom.TLabelframe")
        encabezado_frame.pack(fill="x", pady=10, padx=5)
        
        # Fila 1: Fecha y Tipo
        fila1 = ttk.Frame(encabezado_frame, style="Custom.TFrame")
        fila1.pack(fill="x", pady=5)
        
        ttk.Label(fila1, text="Fecha:", style="Custom.TLabel").pack(side="left", padx=5)
        ttk.Entry(fila1, textvariable=self.fecha_actual, style="Custom.TEntry", width=12).pack(side="left", padx=5)
        
        ttk.Label(fila1, text="Tipo:", style="Custom.TLabel").pack(side="left", padx=(15,5))
        tipo_combo = ttk.Combobox(
            fila1,
            textvariable=self.tipo_entrenamiento,
            values=list(self.ejercicios_predefinidos.keys()),
            state="readonly",
            style="Custom.TCombobox",
            width=25
        )
        tipo_combo.pack(side="left", padx=5)
        tipo_combo.bind("<<ComboboxSelected>>", self.actualizar_ejercicios_disponibles)
        
        # Fila 2: Semana y Ejercicio
        fila2 = ttk.Frame(encabezado_frame, style="Custom.TFrame")
        fila2.pack(fill="x", pady=5)
        
        ttk.Label(fila1, text="Semana:", style="Custom.TLabel").pack(side="left", padx=5)
        ttk.Spinbox(
            fila1,
            textvariable=self.semana_actual,
            from_=1, to=12,
            style="Custom.TSpinbox",
            width=5
        ).pack(side="left", padx=5)
        
        ttk.Label(fila2, text="Ejercicio:", style="Custom.TLabel").pack(side="left", padx=(15,5))
        self.combo_ejercicios = ttk.Combobox(
            fila2,
            textvariable=self.ejercicio_actual,
            state="readonly",
            style="Custom.TCombobox",
            width=25
        )
        self.combo_ejercicios.pack(side="left", padx=5)
        self.actualizar_ejercicios_disponibles()
        
        ttk.Label(fila2, text="Series:", style="Custom.TLabel").pack(side="left", padx=5)
        ttk.Entry(fila2, textvariable=self.series, style="Custom.TEntry", width=5).pack(side="left", padx=5)
        
        ttk.Label(fila2, text="Reps:", style="Custom.TLabel").pack(side="left", padx=(15,5))
        ttk.Entry(fila2, textvariable=self.repeticiones, style="Custom.TEntry", width=5).pack(side="left", padx=5)
        
        ttk.Label(fila2, text="Peso (kg):", style="Custom.TLabel").pack(side="left", padx=(15,5))
        ttk.Entry(fila2, textvariable=self.peso, style="Custom.TEntry", width=5).pack(side="left", padx=5)
        
        # Fila 3: Observaciones y botones
        fila3 = ttk.Frame(encabezado_frame, style="Custom.TFrame")
        fila3.pack(fill="x", pady=5)
        
        ttk.Label(fila3, text="Observaciones:", style="Custom.TLabel").pack(side="left", padx=5)
        ttk.Entry(fila3, textvariable=self.observaciones, style="Custom.TEntry", width=40).pack(side="left", padx=5)
        
        ttk.Button(
            fila3,
            text="➕ Agregar",
            style="Custom.TButton",
            command=self.agregar_ejercicio
        ).pack(side="left", padx=10)
        
        ttk.Button(
            fila3,
            text="✖ Eliminar",
            style="Custom.TButton",
            command=self.eliminar_ejercicio
        ).pack(side="left", padx=5)

    def crear_seccion_ejercicios(self, parent):
        """Crea la sección para mostrar los ejercicios agregados"""
        ejercicios_frame = ttk.LabelFrame(parent, text="Ejercicios del Entrenamiento", style="Custom.TLabelframe")
        ejercicios_frame.pack(fill="both", pady=2, padx=5)
        
        # Treeview para mostrar los ejercicios
        self.tree = ttk.Treeview(
            ejercicios_frame,
            columns=("ejercicio", "series", "reps", "peso", "obs"),
            show="headings",
            style="Custom.Treeview",
            selectmode="browse",
            height=4
        )
        
        # Configurar columnas
        self.tree.heading("ejercicio", text="Ejercicio")
        self.tree.heading("series", text="Series")
        self.tree.heading("reps", text="Repeticiones")
        self.tree.heading("peso", text="Peso (kg)")
        self.tree.heading("obs", text="Observaciones")
        
        self.tree.column("ejercicio", width=250, anchor="w")
        self.tree.column("series", width=80, anchor="center")
        self.tree.column("reps", width=100, anchor="center")
        self.tree.column("peso", width=100, anchor="center")
        self.tree.column("obs", width=300, anchor="w")
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(
            ejercicios_frame,
            orient="vertical",
            command=self.tree.yview,
            style="Custom.Vertical.TScrollbar"
        )
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        # Posicionamiento
        self.tree.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

    def crear_seccion_recomendaciones(self, parent):
        """Crea la sección para mostrar recomendaciones"""
        recomendaciones_frame = ttk.LabelFrame(parent, text="Recomendaciones para el Próximo Entrenamiento", style="Custom.TLabelframe")
        recomendaciones_frame.pack(fill="x", pady=2, padx=5)
        
        # Área de texto con scroll
        self.text_recomendaciones = scrolledtext.ScrolledText(
            recomendaciones_frame,
            wrap=tk.WORD,
            font=Styles.FONT,
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            padx=10,
            pady=10,
            height=5,
            state="normal"
        )
        self.text_recomendaciones.pack(fill="both", expand=True)
        
        # Frame para el botón de recomendaciones
        btn_frame = ttk.Frame(recomendaciones_frame, style="Custom.TFrame")
        btn_frame.pack(fill="x", pady=(5, 0))
        
        # Botón para generar recomendaciones
        ttk.Button(
            recomendaciones_frame,
            text="🔄 Generar Recomendaciones",
            style="Accent.TButton",
            command=self.generar_recomendaciones
        ).pack(pady=5, ipadx=10, ipady=5)

    def crear_botones_accion(self, parent):
        """Crea los botones principales de acción"""
        acciones_frame = ttk.Frame(parent, style="Custom.TFrame")
        acciones_frame.pack(fill="x", pady=10)
        acciones_frame.config(height=60)
        
        ttk.Button(
            acciones_frame,
            text="🧹 Limpiar Todo",
            style="Custom.TButton",
            command=self.limpiar_todo
        ).pack(side="left", padx=10, ipadx=10, ipady=5)
        
        ttk.Button(
            acciones_frame,
            text="💾 Guardar Entrenamiento",
            style="Accent.TButton",
            command=self.guardar_entrenamiento
        ).pack(side="right", padx=10, ipadx=10, ipady=5)
    
        acciones_frame.pack_propagate(False)
        acciones_frame.config(height=60)

    def inicializar_estructura(self):
        """Crea la estructura inicial de directorios"""
        if not os.path.exists("Registros"):
            os.makedirs("Registros")
        if not os.path.exists(os.path.join("Registros", "Gimnasio")):
            os.makedirs(os.path.join("Registros", "Gimnasio"))

    def cargar_ejercicios_predefinidos(self):
        """Carga ejercicios predefinidos por tipo de entrenamiento"""
        return {
            "Pecho-Hombro-Tríceps": [
                "Press plano", "Press inclinado", "Apertura en polea",
                "Press en polea", "Apertura en polea alta(mono)", "Apertura en polea baja",
                "Press militar", "Elevaciones laterales", "Fondos", "Extension de triceps", 
                "Extension de triceps en polea alta", "Patada de triceps"
            ],
            "Pierna": [
                "Sentadilla hack", "Prensa", "Peso muerto",
                "Extensiones de cuadriceps", "Curl femoral", "Elevaciones de gemelos", "Zancadas",
                "Femoral en polea"
            ],
            "Espalda-Bíceps-Antebrazo": [
                "Dominadas lastre", "Remo en T alto", "Jalón al pecho","Jalon al pecho abierto", 
                "Pull over","Remo en polea alta","Remo en polea baja",  "Curl de bíceps", "Curl martillo",
                "Extension de muñeca", "Curl de antebrazo"
            ],
            "Cardio": [
                "Cinta", "Bicicleta","Natación"
            ]
        }

    def actualizar_ejercicios_disponibles(self, event=None):
        """Actualiza los ejercicios disponibles según el tipo de entrenamiento"""
        ejercicios = self.ejercicios_predefinidos.get(self.tipo_entrenamiento.get(), [])
        self.combo_ejercicios["values"] = ejercicios
        if ejercicios:
            self.ejercicio_actual.set(ejercicios[0])

    def agregar_ejercicio(self):
        """Agrega un ejercicio a la lista"""
        ejercicio = self.ejercicio_actual.get()
        series = self.series.get()
        reps = self.repeticiones.get()
        peso = self.peso.get()
        obs = self.observaciones.get()
        
        if not ejercicio:
            Styles.show_msg_error("Debes seleccionar un ejercicio")
            return
            
        try:
            # Validar que los valores numéricos sean correctos
            series = int(series)
            reps = int(reps)
            peso = float(peso)
        except ValueError:
            Styles.show_msg_error("Series, repeticiones y peso deben ser valores numéricos válidos")
            return
            
        # Agregar a la lista
        self.tree.insert("", "end", values=(ejercicio, series, reps, peso, obs))
        
        # Limpiar campos
        self.observaciones.set("")
        self.peso.set("0")

    def eliminar_ejercicio(self):
        """Elimina el ejercicio seleccionado"""
        seleccion = self.tree.selection()
        if seleccion:
            self.tree.delete(seleccion)
        else:
            Styles.show_msg_error("Selecciona un ejercicio para eliminar")

    def limpiar_todo(self):
        """Limpia todos los campos y la lista de ejercicios"""
        self.tree.delete(*self.tree.get_children())
        self.observaciones.set("")
        self.peso.set("0")
        self.text_recomendaciones.config(state="normal")
        self.text_recomendaciones.delete("1.0", tk.END)
        self.text_recomendaciones.config(state="disabled")

    def generar_recomendaciones(self):
        """Genera recomendaciones personalizadas para cada ejercicio"""
        if not self.tree.get_children():
            Styles.show_msg_error("Agrega ejercicios para generar recomendaciones")
            return
        
        recomendaciones = []
        semana = self.semana_actual.get()
        
        for item in self.tree.get_children():
            ejercicio, series, reps, peso, _ = self.tree.item(item, "values")
            
            try:
                peso_actual = float(peso)
                reps_actual = int(reps)
                series_actual = int(series)
                
                # Lógica de progresión basada en la semana
                if semana % 4 == 0:  # Semana de aumento de peso
                    nuevo_peso = peso_actual * 1.025  # 2.5% más
                    rec = f"{ejercicio}: {series_actual} series de {max(8, reps_actual-2)} reps con {nuevo_peso:.1f} kg (+2.5%)"
                elif semana % 4 == 1:  # Semana de adaptación
                    rec = f"{ejercicio}: {series_actual} series de {reps_actual} reps (consolidación técnica)"
                elif semana % 4 == 2:  # Semana de volumen
                    rec = f"{ejercicio}: {series_actual+1} series de {reps_actual} reps (aumento volumen)"
                else:  # Semana de intensidad
                    rec = f"{ejercicio}: {series_actual} series de {reps_actual+2} reps (aumento intensidad)"
                
                recomendaciones.append(rec)
            except ValueError:
                recomendaciones.append(f"{ejercicio}: Datos incompletos para generar progresión")
        
        # Mostrar recomendaciones
        self.text_recomendaciones.config(state="normal")
        self.text_recomendaciones.delete("1.0", tk.END)
        
        header = f"RECOMENDACIONES PARA LA SEMANA {semana + 1}:\n\n"
        self.text_recomendaciones.insert(tk.END, header, "header")
        
        for rec in recomendaciones:
            self.text_recomendaciones.insert(tk.END, f"• {rec}\n")
        
        notas = "\nNOTAS:\n"
        notas += "- Mantén una técnica perfecta en todas las repeticiones\n"
        notas += "- Descansa 2-3 minutos entre series de ejercicios pesados\n"
        notas += "- Si no completas todas las repeticiones, mantén el mismo peso la próxima semana\n"
        notas += "- Realiza un calentamiento adecuado antes de comenzar\n"
        
        self.text_recomendaciones.insert(tk.END, notas, "notas")
        self.text_recomendaciones.config(state="disabled")
        
        # Formato del texto
        self.text_recomendaciones.tag_config("header", font=(Styles.FONT_FAMILY, 12, "bold"))
        self.text_recomendaciones.tag_config("notas", foreground="#555555")
        
        
    def cargar_entrenamiento_para_edicion(self):
        """Carga un entrenamiento existente para editarlo"""
        if not self.entrenamiento_actual:
            return

        # Mostrar mensaje de confirmación
        if not messagebox.askyesno(
            "Confirmar edición",
            f"¿Estás seguro de que quieres editar el entrenamiento del {self.entrenamiento_actual['fecha']}?",
            parent=self.root
        ):
            return

        # Cambiar a la vista de registro
        self.mostrar_registro_entrenamiento()

        # Cargar los datos del entrenamiento
        self.fecha_actual.set(self.entrenamiento_actual['fecha'])
        self.tipo_entrenamiento.set(self.entrenamiento_actual['tipo'])
        self.semana_actual.set(self.entrenamiento_actual['semana'])

        # Limpiar treeview
        self.tree.delete(*self.tree.get_children())

        # Cargar ejercicios
        for ejercicio in self.entrenamiento_actual['ejercicios']:
            self.tree.insert("", "end", values=(
                ejercicio['ejercicio'],
                ejercicio['series'],
                ejercicio['repeticiones'],
                ejercicio['peso'],
                ejercicio['observaciones']
            ))

        # Cargar recomendaciones
        self.text_recomendaciones.config(state="normal")
        self.text_recomendaciones.delete("1.0", tk.END)
        if 'recomendaciones' in self.entrenamiento_actual:
            self.text_recomendaciones.insert(tk.END, self.entrenamiento_actual['recomendaciones'])
        self.text_recomendaciones.config(state="disabled")

        # Guardar referencia al archivo original para sobreescribirlo al guardar
        self.archivo_a_sobreescribir = self.fecha_entrenamiento_actual

    # def guardar_entrenamiento(self):
    #     """Guarda el entrenamiento como archivo JSON"""
    #     fecha = self.fecha_actual.get()
    #     tipo = self.tipo_entrenamiento.get()
    #     semana = self.semana_actual.get()
        
    #     if not fecha or not tipo:
    #         Styles.show_msg_error("Debes completar la fecha y el tipo de entrenamiento")
    #         return
            
    #     if not self.tree.get_children():
    #         Styles.show_msg_error("Debes agregar al menos un ejercicio")
    #         return
            
    #     # Recoger todos los ejercicios
    #     ejercicios = []
    #     for item in self.tree.get_children():
    #         valores = self.tree.item(item, "values")
    #         ejercicios.append({
    #             "ejercicio": valores[0],
    #             "series": valores[1],
    #             "repeticiones": valores[2],
    #             "peso": valores[3],
    #             "observaciones": valores[4]
    #         })
        
    #     # Crear estructura de datos
    #     entrenamiento = {
    #         "fecha": fecha,
    #         "tipo": tipo,
    #         "semana": semana,
    #         "ejercicios": ejercicios,
    #         "recomendaciones": self.text_recomendaciones.get("1.0", tk.END)
    #     }
        
    #     # Crear nombre de archivo seguro
    #     nombre_archivo = f"{fecha}_{tipo.lower().replace(' ', '_')}.json"
    #     nombre_archivo = "".join(c for c in nombre_archivo if c.isalnum() or c in ("_", "-", "."))
        
    #     ruta_completa = os.path.join("Registros", "Gimnasio", nombre_archivo)
        
    #     try:
    #         # Guardar como JSON
    #         with open(ruta_completa, "w", encoding="utf-8") as f:
    #             json.dump(entrenamiento, f, indent=2, ensure_ascii=False)
            
    #         Styles.show_msg(f"Entrenamiento guardado exitosamente en:\n{ruta_completa}")
            
    #         # Limpiar campos
    #         self.limpiar_todo()
    #         self.semana_actual.set(semana + 1)
            
    #     except Exception as e:
    #         Styles.show_msg_error(f"Error al guardar el entrenamiento:\n{str(e)}")

    def guardar_entrenamiento(self):
        """Guarda el entrenamiento como archivo JSON"""
        fecha = self.fecha_actual.get()
        tipo = self.tipo_entrenamiento.get()
        semana = self.semana_actual.get()

        if not fecha or not tipo:
            Styles.show_msg_error("Debes completar la fecha y el tipo de entrenamiento")
            return

        if not self.tree.get_children():
            Styles.show_msg_error("Debes agregar al menos un ejercicio")
            return

        # Confirmación antes de guardar
        if not messagebox.askyesno(
            "Confirmar guardado",
            "¿Estás seguro de que los datos son correctos?\n\n"
            "Revisa:\n"
            "- Fecha correcta\n"
            "- Ejercicios completos\n"
            "- Peso y repeticiones exactas",
            parent=self.root
        ):
            return

        # Recoger todos los ejercicios
        ejercicios = []
        for item in self.tree.get_children():
            valores = self.tree.item(item, "values")
            ejercicios.append({
                "ejercicio": valores[0],
                "series": valores[1],
                "repeticiones": valores[2],
                "peso": valores[3],
                "observaciones": valores[4]
            })

        # Crear estructura de datos
        entrenamiento = {
            "fecha": fecha,
            "tipo": tipo,
            "semana": semana,
            "ejercicios": ejercicios,
            "recomendaciones": self.text_recomendaciones.get("1.0", tk.END)
        }

        # Crear nombre de archivo seguro
        nombre_archivo = f"{fecha}_{tipo.lower().replace(' ', '_')}.json"
        nombre_archivo = "".join(c for c in nombre_archivo if c.isalnum() or c in ("_", "-", "."))

        # Si estamos editando, usar el nombre original
        if hasattr(self, 'archivo_a_sobreescribir'):
            nombre_archivo = self.archivo_a_sobreescribir + '.json'
            # Eliminar el atributo para futuros guardados
            del self.archivo_a_sobreescribir

        ruta_completa = os.path.join("Registros", "Gimnasio", nombre_archivo)

        try:
            # Guardar como JSON
            with open(ruta_completa, "w", encoding="utf-8") as f:
                json.dump(entrenamiento, f, indent=2, ensure_ascii=False)

            Styles.show_msg(f"Entrenamiento guardado exitosamente en:\n{ruta_completa}")

            # Limpiar campos
            self.limpiar_todo()
            self.semana_actual.set(semana + 1)

        except Exception as e:
            Styles.show_msg_error(f"Error al guardar el entrenamiento:\n{str(e)}")


    def mostrar_control_peso(self):
        """Muestra la interfaz para el control de peso y calorías"""
        # Limpiar el contenido principal si existe
        if hasattr(self, 'main_content'):
            self.main_content.destroy()

        self.main_content = ttk.Frame(self.root, style="Custom.TFrame")
        self.main_content.pack(expand=True, fill="both", padx=20, pady=(0, 20))

        # Frame para datos personales
        datos_frame = ttk.LabelFrame(self.main_content, text="Datos Personales", style="Custom.TLabelframe")
        datos_frame.pack(fill="x", pady=10, padx=5)

        # Fila 1: Sexo y Edad
        fila1 = ttk.Frame(datos_frame, style="Custom.TFrame")
        fila1.pack(fill="x", pady=5)

        ttk.Label(fila1, text="Sexo:", style="Custom.TLabel").pack(side="left", padx=5)
        ttk.Combobox(
            fila1,
            textvariable=self.sexo,
            values=["Hombre", "Mujer"],
            state="readonly",
            style="Custom.TCombobox",
            width=10
        ).pack(side="left", padx=5)

        ttk.Label(fila1, text="Edad:", style="Custom.TLabel").pack(side="left", padx=(15,5))
        ttk.Entry(fila1, textvariable=self.edad, style="Custom.TEntry", width=5).pack(side="left", padx=5)

        # Fila 2: Peso y Altura
        fila2 = ttk.Frame(datos_frame, style="Custom.TFrame")
        fila2.pack(fill="x", pady=5)

        ttk.Label(fila2, text="Peso (kg):", style="Custom.TLabel").pack(side="left", padx=5)
        ttk.Entry(fila2, textvariable=self.peso_actual, style="Custom.TEntry", width=5).pack(side="left", padx=5)

        ttk.Label(fila2, text="Altura (cm):", style="Custom.TLabel").pack(side="left", padx=(15,5))
        ttk.Entry(fila2, textvariable=self.altura, style="Custom.TEntry", width=5).pack(side="left", padx=5)

        # Fila 3: Nivel de actividad y Objetivo
        fila3 = ttk.Frame(datos_frame, style="Custom.TFrame")
        fila3.pack(fill="x", pady=5)

        ttk.Label(fila3, text="Nivel actividad:", style="Custom.TLabel").pack(side="left", padx=5)
        ttk.Combobox(
            fila3,
            textvariable=self.nivel_actividad,
            values=list(self.factores_actividad.keys()),
            state="readonly",
            style="Custom.TCombobox",
            width=25
        ).pack(side="left", padx=5)

        ttk.Label(fila3, text="Objetivo:", style="Custom.TLabel").pack(side="left", padx=(15,5))
        ttk.Combobox(
            fila3,
            textvariable=self.objetivo,
            values=list(self.factores_objetivo.keys()),
            state="readonly",
            style="Custom.TCombobox",
            width=20
        ).pack(side="left", padx=5)

        # Botón para calcular
        ttk.Button(
            datos_frame,
            text="Calcular Calorías",
            style="Accent.TButton",
            command=self.calcular_calorias
        ).pack(pady=10, ipadx=10, ipady=5)

        # Resultados
        resultados_frame = ttk.LabelFrame(self.main_content, text="Resultados", style="Custom.TLabelframe")
        resultados_frame.pack(fill="x", pady=10, padx=5)

        self.resultados_text = scrolledtext.ScrolledText(
            resultados_frame,
            wrap=tk.WORD,
            font=Styles.FONT,
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            padx=10,
            pady=10,
            height=8,
            state="disabled"
        )
        self.resultados_text.pack(fill="both", expand=True)

        # Botón para guardar registro de peso
        ttk.Button(
            self.main_content,
            text="💾 Guardar Registro de Peso",
            style="Accent.TButton",
            command=self.guardar_registro_peso
        ).pack(pady=10, ipadx=10, ipady=5)
        
    def calcular_calorias(self):
        """Calcula las calorías diarias usando Harris-Benedict"""
        try:
            peso = float(self.peso_actual.get())
            altura = float(self.altura.get())
            edad = int(self.edad.get())
            sexo = self.sexo.get()
            actividad = self.factores_actividad[self.nivel_actividad.get()]
            objetivo = self.factores_objetivo[self.objetivo.get()]

            # Fórmula Harris-Benedict revisada (Mifflin-St Jeor)
            if sexo == "Hombre":
                tmb = (10 * peso) + (6.25 * altura) - (5 * edad) + 5
            else:
                tmb = (10 * peso) + (6.25 * altura) - (5 * edad) - 161

            calorias = (tmb * actividad) + objetivo

            # Mostrar resultados
            self.resultados_text.config(state="normal")
            self.resultados_text.delete("1.0", tk.END)

            self.resultados_text.insert(tk.END, "⚡ Metabolismo Basal (TMB):\n", "header")
            self.resultados_text.insert(tk.END, f"{tmb:.0f} kcal/día\n\n", "bold")

            self.resultados_text.insert(tk.END, "🔥 Gasto Calórico Total (GET):\n", "header")
            self.resultados_text.insert(tk.END, f"{(tmb * actividad):.0f} kcal/día\n\n", "bold")

            self.resultados_text.insert(tk.END, "🎯 Calorías Diarias Recomendadas:\n", "header")
            self.resultados_text.insert(tk.END, f"{calorias:.0f} kcal/día\n\n", "bold")

            # Recomendaciones según objetivo
            if objetivo < 0:
                self.resultados_text.insert(tk.END, "🔻 Estás en déficit calórico (pérdida de peso)\n", "info")
            elif objetivo > 0:
                self.resultados_text.insert(tk.END, "🔺 Estás en superávit calórico (ganancia muscular)\n", "info")
            else:
                self.resultados_text.insert(tk.END, "⏸ Estás en mantenimiento\n", "info")

            self.resultados_text.tag_config("header", font=(Styles.FONT_FAMILY, 10, "bold"))
            self.resultados_text.tag_config("bold", font=(Styles.FONT_FAMILY, 12, "bold"))
            self.resultados_text.tag_config("info", foreground=Styles.COLOR_ACCENT)
            self.resultados_text.config(state="disabled")

            self.calorias_diarias.set(f"{calorias:.0f}")

        except ValueError:
            Styles.show_msg_error("Por favor ingresa valores numéricos válidos")
            

    # def guardar_registro_peso(self):
    #     """Guarda el registro de peso en el archivo correspondiente"""
    #     fecha = self.fecha_actual.get()
    #     peso = self.peso_actual.get()

    #     if not fecha or not peso:
    #         Styles.show_msg_error("Debes completar la fecha y el peso actual")
    #         return

    #     try:
    #         peso_num = float(peso)
    #     except ValueError:
    #         Styles.show_msg_error("El peso debe ser un valor numérico válido")
    #         return

    #     # Crear estructura de datos
    #     registro = {
    #         "fecha": fecha,
    #         "peso": peso_num,
    #         "calorias_diarias": self.calorias_diarias.get() or "No calculado",
    #         "sexo": self.sexo.get(),
    #         "edad": self.edad.get(),
    #         "altura": self.altura.get(),
    #         "nivel_actividad": self.nivel_actividad.get(),
    #         "objetivo": self.objetivo.get()
    #     }

    #     # Crear nombre de archivo seguro
    #     nombre_archivo = f"peso_{fecha}.json"
    #     nombre_archivo = "".join(c for c in nombre_archivo if c.isalnum() or c in ("_", "-", "."))

    #     ruta_completa = os.path.join("Registros", "Gimnasio", nombre_archivo)

    #     try:
    #         # Guardar como JSON
    #         with open(ruta_completa, "w", encoding="utf-8") as f:
    #             json.dump(registro, f, indent=2, ensure_ascii=False)

    #         Styles.show_msg(f"Registro de peso guardado exitosamente en:\n{ruta_completa}")

    #     except Exception as e:
    #         Styles.show_msg_error(f"Error al guardar el registro de peso:\n{str(e)}")

    def guardar_registro_peso(self):
        """Guarda el registro de peso en un archivo JSON"""
        try:
            # Obtener la fecha actual si no hay una específica
            fecha = self.fecha_actual.get() or date.today().strftime("%Y-%m-%d")

            # Verificar que los datos requeridos estén presentes
            if not self.peso_actual.get():
                raise ValueError("El peso actual es requerido")

            # Crear estructura de datos
            registro = {
                "fecha": fecha,
                "peso": float(self.peso_actual.get()),
                "altura": float(self.altura.get()),
                "edad": int(self.edad.get()),
                "sexo": self.sexo.get(),
                "nivel_actividad": self.nivel_actividad.get(),
                "objetivo": self.objetivo.get(),
                "calorias_diarias": self.calorias_diarias.get() or "No calculado",
                "metabolismo_basal": self.calcular_metabolismo_basal(),
                "timestamp": datetime.now().isoformat()
            }

            # Crear directorio si no existe
            os.makedirs(os.path.join("Registros", "Peso"), exist_ok=True)

            # Nombre del archivo
            nombre_archivo = f"peso_{fecha}.json"
            ruta_completa = os.path.join("Registros", "Peso", nombre_archivo)

            # Guardar como JSON
            with open(ruta_completa, "w", encoding="utf-8") as f:
                json.dump(registro, f, indent=2, ensure_ascii=False)

            Styles.show_msg(f"Registro de peso guardado en:\n{ruta_completa}")

        except ValueError as e:
            Styles.show_msg_error(f"Datos inválidos: {str(e)}")
        except Exception as e:
            Styles.show_msg_error(f"Error al guardar: {str(e)}")

    def calcular_metabolismo_basal(self):
        """Calcula solo el metabolismo basal"""
        try:
            peso = float(self.peso_actual.get())
            altura = float(self.altura.get())
            edad = int(self.edad.get())
            sexo = self.sexo.get()

            if sexo == "Hombre":
                return (10 * peso) + (6.25 * altura) - (5 * edad) + 5
            else:
                return (10 * peso) + (6.25 * altura) - (5 * edad) - 161
        except:
            return "No calculado"
        
    def obtener_datos_peso(self):
        """Obtiene los datos históricos de peso corporal"""
        ruta_peso = os.path.join("Registros", "Peso")
        datos_peso = []

        if os.path.exists(ruta_peso):
            for archivo in os.listdir(ruta_peso):
                if archivo.startswith("peso_") and archivo.endswith(".json"):
                    try:
                        with open(os.path.join(ruta_peso, archivo), "r", encoding="utf-8") as f:
                            registro = json.load(f)
                            datos_peso.append({
                                'fecha': registro['fecha'],
                                'peso': registro['peso']
                            })
                    except:
                        continue
                    
        # Ordenar por fecha
        datos_peso.sort(key=lambda x: datetime.strptime(x['fecha'], "%Y-%m-%d"))
        return datos_peso


if __name__ == "__main__":
    root = tk.Tk()
    app = GimnasioApp(root)
    root.mainloop()