import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
import os
from styles import Styles

class DiarioApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Mi Diario Personal")
        self.root.geometry("1000x800")
        
        # Configuración inicial
        Styles.apply_styles()
        Styles.apply_window_style(root)
        
        # Variables de control
        self.seccion_actual = tk.StringVar(value="Elije una sección")
        self.nueva_seccion = tk.StringVar()
        
        # Crear estructura de widgets
        self.setup_ui()
        
        # Inicializar sistema de archivos
        self.inicializar_estructura()

    def setup_ui(self):
        """Configura la interfaz de usuario principal"""
        # Frame principal con padding
        self.main_frame = ttk.Frame(self.root, style="Custom.TFrame")
        self.main_frame.pack(expand=True, fill="both", padx=30, pady=30)
        
        # Configurar grid para mejor organización
        self.main_frame.columnconfigure(0, weight=1)
        self.main_frame.rowconfigure(3, weight=1)
        
        # Título de la aplicación
        self.crear_titulo()
        
        # Controles de sección
        self.crear_controles_seccion()
        
        # Campos de entrada
        self.crear_campos_entrada()
        
        # Área de texto
        self.crear_area_texto()
        
        # Botones de acción
        self.crear_botones_accion()

    def inicializar_estructura(self):
        """Crea la estructura inicial de directorios"""
        if not os.path.exists("Registros"):
            os.makedirs("Registros")
        if not os.path.exists(os.path.join("Registros", "General")):
            os.makedirs(os.path.join("Registros", "General"))

    def crear_titulo(self):
        """Crea el título de la aplicación"""
        lbl_titulo = ttk.Label(
            self.main_frame, 
            text="Mi Diario Personal", 
            style="Custom.Header.TLabel"
        )
        lbl_titulo.grid(row=0, column=0, pady=(0, 20), sticky="w")

    def crear_controles_seccion(self):
        """Crea los controles para manejar secciones"""
        frame_seccion = ttk.Frame(self.main_frame, style="Custom.TFrame")
        frame_seccion.grid(row=1, column=0, sticky="ew", pady=10)
        
        # Label y Combobox para secciones existentes
        ttk.Label(frame_seccion, text="Sección:", style="Custom.TLabel").pack(side="left", padx=5)
        
        self.combo_secciones = ttk.Combobox(
            frame_seccion,
            textvariable=self.seccion_actual,
            values=self.obtener_secciones(),
            state="readonly",
            style="Custom.TCombobox",
            width=25
        )
        self.combo_secciones.pack(side="left", padx=5)
        self.combo_secciones.bind("<<ComboboxSelected>>", self.actualizar_seccion)
        
        # Separador visual
        ttk.Separator(frame_seccion, orient="vertical").pack(side="left", fill="y", padx=10)
        
        # Controles para nueva sección
        ttk.Label(frame_seccion, text="Nueva sección:", style="Custom.TLabel").pack(side="left", padx=5)
        
        ttk.Entry(
            frame_seccion,
            textvariable=self.nueva_seccion,
            style="Custom.TEntry",
            width=25
        ).pack(side="left", padx=5)
        
        ttk.Button(
            frame_seccion,
            text="Crear Sección",
            style="Custom.TButton",
            command=self.crear_seccion
        ).pack(side="left", padx=5)

    def crear_campos_entrada(self):
        """Crea los campos para el título de la entrada"""
        frame_titulo = ttk.Frame(self.main_frame, style="Custom.TFrame")
        frame_titulo.grid(row=2, column=0, sticky="ew", pady=10)
        
        ttk.Label(
            frame_titulo, 
            text="Título de la entrada:", 
            style="Custom.TLabel"
        ).pack(side="left", padx=5)
        
        self.entry_titulo = ttk.Entry(
            frame_titulo,
            style="Custom.TEntry",
            width=70
        )
        self.entry_titulo.pack(side="left", expand=True, fill="x", padx=5)
        
        # Poner foco en el campo de título al iniciar
        self.entry_titulo.focus_set()

    def crear_area_texto(self):
        """Crea el área de texto para el contenido"""
        frame_texto = ttk.Frame(self.main_frame, style="Custom.Border.TFrame")
        frame_texto.grid(row=3, column=0, sticky="nsew", pady=10)
        
        # Configurar grid para el área de texto
        frame_texto.columnconfigure(0, weight=1)
        frame_texto.rowconfigure(0, weight=1)
        
        # Área de texto principal
        self.text_contenido = tk.Text(
            frame_texto,
            wrap="word",
            font=Styles.FONT,
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            padx=15,
            pady=15,
            insertbackground=Styles.COLOR_TEXT,
            undo=True,  # Habilitar funcionalidad de deshacer
            maxundo=-1,  # Número ilimitado de operaciones para deshacer
            autoseparators=True  # Separadores automáticos para operaciones de deshacer
        )
        
        # Scrollbar vertical
        scroll_y = ttk.Scrollbar(
            frame_texto,
            orient="vertical",
            command=self.text_contenido.yview,
            style="Custom.Vertical.TScrollbar"
        )
        self.text_contenido.configure(yscrollcommand=scroll_y.set)
        
        # Scrollbar horizontal
        scroll_x = ttk.Scrollbar(
            frame_texto,
            orient="horizontal",
            command=self.text_contenido.xview,
            style="Custom.Horizontal.TScrollbar"
        )
        self.text_contenido.configure(xscrollcommand=scroll_x.set)
        
        # Posicionamiento de widgets
        self.text_contenido.grid(row=0, column=0, sticky="nsew")
        scroll_y.grid(row=0, column=1, sticky="ns")
        scroll_x.grid(row=1, column=0, sticky="ew")

    def crear_botones_accion(self):
        """Crea los botones de acción principales"""
        frame_botones = ttk.Frame(self.main_frame, style="Custom.TFrame")
        frame_botones.grid(row=4, column=0, sticky="e", pady=10)
        
        # Botón para vaciar campos
        ttk.Button(
            frame_botones,
            text="↻ Vaciar Campos",
            style="Custom.TButton",
            command=self.vaciar_campos
        ).pack(side="left", padx=10, ipadx=10, ipady=5)
        
        # Botón para guardar
        ttk.Button(
            frame_botones,
            text="💾 Guardar Entrada",
            style="Accent.TButton",
            command=self.guardar_entrada
        ).pack(side="left", padx=10, ipadx=20, ipady=8)

    def obtener_secciones(self):
        """Obtiene la lista de secciones disponibles"""
        secciones = []
        if os.path.exists("Registros"):
            secciones = [d for d in os.listdir("Registros") 
                        if os.path.isdir(os.path.join("Registros", d))]
        return secciones or ["general"]

    def actualizar_seccion(self, event=None):
        """Actualiza la lista de secciones en el combobox"""
        secciones = self.obtener_secciones()
        self.combo_secciones["values"] = secciones
        if not self.seccion_actual.get() in secciones:
            self.seccion_actual.set(secciones[0] if secciones else "general")

    def crear_seccion(self):
        """Crea una nueva sección para entradas"""
        nombre = self.nueva_seccion.get().strip()
        
        if not nombre:
            Styles.show_msg_error("Debe ingresar un nombre para la nueva sección.")
            return
        
        # Sanitizar nombre
        nombre = "".join(c for c in nombre if c.isalnum() or c in (" ", "_")).strip()
        nombre = nombre.replace(" ", "_")
        
        if not nombre:
            Styles.show_msg_error("El nombre debe contener caracteres válidos.")
            return
            
        try:
            os.makedirs(os.path.join("Registros", nombre), exist_ok=True)
            Styles.show_msg(f"Sección '{nombre}' creada exitosamente!")
            self.nueva_seccion.set("")
            self.actualizar_seccion()
            self.seccion_actual.set(nombre)
        except Exception as e:
            Styles.show_msg_error(f"Error al crear sección:\n{str(e)}")

    def vaciar_campos(self):
        """Limpia todos los campos de entrada"""
        self.entry_titulo.delete(0, tk.END)
        self.text_contenido.delete("1.0", tk.END)
        self.entry_titulo.focus_set()

    def guardar_entrada(self):
        """Guarda la entrada actual en el diario"""
        titulo = self.entry_titulo.get().strip()
        contenido = self.text_contenido.get("1.0", tk.END).strip()
        seccion = self.seccion_actual.get()
        
        # Validaciones
        if not titulo:
            Styles.show_msg_error("El título no puede estar vacío.")
            return
            
        if not contenido:
            Styles.show_msg_error("El contenido no puede estar vacío.")
            return
            
        # Preparar datos
        fecha = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        nombre_archivo = f"{fecha}_{titulo[:50].replace(' ', '_')}.txt"
        nombre_archivo = "".join(c for c in nombre_archivo if c.isalnum() or c in ("_", "-", "."))
        
        ruta_completa = os.path.join("Registros", seccion, nombre_archivo)
        
        try:
            # Crear directorio si no existe
            os.makedirs(os.path.dirname(ruta_completa), exist_ok=True)
            
            # Escribir archivo
            with open(ruta_completa, "w", encoding="utf-8") as f:
                f.write(f"Sección: {seccion}\n")
                f.write(f"Título: {titulo}\n")
                f.write(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                f.write(contenido)
            
            # Feedback al usuario
            Styles.show_msg(f"Entrada guardada en:\n{ruta_completa}")
            
            # Limpiar campos
            self.vaciar_campos()
            
        except Exception as e:
            Styles.show_msg_error(f"Error al guardar:\n{str(e)}")

if __name__ == "__main__":
    root = tk.Tk()
    app = DiarioApp(root)
    root.state("zoomed")
    root.mainloop()