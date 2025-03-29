import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
import os
import sys
from styles import Styles

class DiarioApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Mi Diario Personal")
        self.root.geometry("1200x800")
        
      
        # Configuración inicial
        Styles.apply_styles()
        Styles.apply_window_style(root)
        
        # Variables de control
        self.seccion_actual = tk.StringVar(value="General")
        self.nueva_seccion = tk.StringVar()
        self.nota_actual = tk.StringVar()
        self.titulo_actual = tk.StringVar()
        
        # Crear estructura de widgets
        self.setup_ui()
        
        # Inicializar sistema de archivos
        self.inicializar_estructura()
        self.actualizar_lista_secciones()
        self.actualizar_lista_notas()

    def setup_ui(self):
        """Configura la interfaz de usuario principal"""
        # Frame principal con padding
        self.main_frame = ttk.Frame(self.root, style="Custom.TFrame")
        self.main_frame.pack(expand=True, fill="both", padx=10, pady=10)
        
        # Configurar grid para mejor organización
        self.main_frame.columnconfigure(1, weight=1)
        self.main_frame.rowconfigure(1, weight=1)
        
        # Panel izquierdo (lista de secciones y notas)
        self.crear_panel_izquierdo()
        
        # Panel derecho (editor)
        self.crear_panel_derecho()

    def crear_panel_izquierdo(self):
        """Crea el panel izquierdo con listas de secciones y notas"""
        panel_izquierdo = ttk.Frame(self.main_frame, style="Custom.TFrame", width=250)
        panel_izquierdo.grid(row=0, column=0, rowspan=2, sticky="nswe", padx=5, pady=5)
        panel_izquierdo.pack_propagate(False)
        
        # Frame para secciones
        frame_secciones = ttk.LabelFrame(panel_izquierdo, text="Secciones", style="Custom.TLabelframe")
        frame_secciones.pack(fill="x", pady=5)
        
        # Lista de secciones
        self.lista_secciones = tk.Listbox(
            frame_secciones,
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            selectbackground=Styles.COLOR_PRIMARY,
            font=Styles.FONT,
            borderwidth=0,
            highlightthickness=0,
            selectmode=tk.SINGLE
        )
        self.lista_secciones.pack(fill="both", expand=True)
        self.lista_secciones.bind("<<ListboxSelect>>", self.on_seccion_seleccionada)
        
        # Frame para crear nueva sección
        frame_nueva_seccion = ttk.Frame(frame_secciones, style="Custom.TFrame")
        frame_nueva_seccion.pack(fill="x", pady=5)
        
        ttk.Entry(
            frame_nueva_seccion,
            textvariable=self.nueva_seccion,
            style="Custom.TEntry"
        ).pack(side="left", fill="x", expand=True, padx=5)
        
        ttk.Button(
            frame_nueva_seccion,
            text="+",
            style="Custom.TButton",
            command=self.crear_seccion,
            width=3
        ).pack(side="right", padx=5)
        
        # Frame para notas
        frame_notas = ttk.LabelFrame(panel_izquierdo, text="Notas", style="Custom.TLabelframe")
        frame_notas.pack(fill="both", expand=True, pady=5)
        
        # Lista de notas
        self.lista_notas = tk.Listbox(
            frame_notas,
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            selectbackground=Styles.COLOR_PRIMARY,
            font=Styles.FONT,
            borderwidth=0,
            highlightthickness=0,
            selectmode=tk.SINGLE
        )
        self.lista_notas.pack(fill="both", expand=True)
        self.lista_notas.bind("<<ListboxSelect>>", self.on_nota_seleccionada)

    def crear_panel_derecho(self):
        """Crea el panel derecho con el editor de notas"""
        panel_derecho = ttk.Frame(self.main_frame, style="Custom.TFrame")
        panel_derecho.grid(row=0, column=1, rowspan=2, sticky="nswe", padx=5, pady=5)
        
        # Frame para el título
        frame_titulo = ttk.Frame(panel_derecho, style="Custom.TFrame")
        frame_titulo.pack(fill="x", pady=5)
        
        ttk.Label(
            frame_titulo, 
            text="Título:", 
            style="Custom.TLabel"
        ).pack(side="left", padx=5)
        
        self.entry_titulo = ttk.Entry(
            frame_titulo,
            textvariable=self.titulo_actual,
            style="Custom.TEntry"
        )
        self.entry_titulo.pack(fill="x", expand=True, padx=5)
        
        # Área de texto para el contenido
        frame_texto = ttk.Frame(panel_derecho, style="Custom.Border.TFrame")
        frame_texto.pack(fill="both", expand=True, pady=5)
        
        # Área de texto con scrollbars
        self.text_contenido = tk.Text(
            frame_texto,
            wrap="word",
            font=Styles.FONT,
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            padx=15,
            pady=15,
            insertbackground=Styles.COLOR_TEXT,
            undo=True
        )
        
        scroll_y = ttk.Scrollbar(
            frame_texto,
            orient="vertical",
            command=self.text_contenido.yview,
            style="Custom.Vertical.TScrollbar"
        )
        self.text_contenido.configure(yscrollcommand=scroll_y.set)
        
        scroll_x = ttk.Scrollbar(
            frame_texto,
            orient="horizontal",
            command=self.text_contenido.xview,
            style="Custom.Horizontal.TScrollbar"
        )
        self.text_contenido.configure(xscrollcommand=scroll_x.set)
        
        # Posicionamiento
        self.text_contenido.grid(row=0, column=0, sticky="nsew")
        scroll_y.grid(row=0, column=1, sticky="ns")
        scroll_x.grid(row=1, column=0, sticky="ew")
        
        frame_texto.grid_rowconfigure(0, weight=1)
        frame_texto.grid_columnconfigure(0, weight=1)
        
        # Botones de acción
        frame_botones = ttk.Frame(panel_derecho, style="Custom.TFrame")
        frame_botones.pack(fill="x", pady=5)
        
        ttk.Button(
            frame_botones,
            text="Nueva Nota",
            style="Custom.TButton",
            command=self.nueva_nota
        ).pack(side="left", padx=5)
        
        ttk.Button(
            frame_botones,
            text="Eliminar",
            style="Danger.TButton",  # Asegúrate de tener este estilo definido
            command=self.eliminar_nota
        ).pack(side="left", padx=5)
        
        ttk.Button(
            frame_botones,
            text="Guardar",
            style="Accent.TButton",
            command=self.guardar_nota
        ).pack(side="right", padx=5)

    def inicializar_estructura(self):
        """Crea la estructura inicial de directorios"""
        if not os.path.exists("Registros"):
            os.makedirs("Registros")
        if not os.path.exists(os.path.join("Registros", "General")):
            os.makedirs(os.path.join("Registros", "General"))

    def actualizar_lista_secciones(self):
        """Actualiza la lista de secciones disponibles"""
        self.lista_secciones.delete(0, tk.END)
        if os.path.exists("Registros"):
            secciones = sorted([d for d in os.listdir("Registros") 
                              if os.path.isdir(os.path.join("Registros", d))])
            for seccion in secciones:
                self.lista_secciones.insert(tk.END, seccion)
        
        # Seleccionar la primera sección si existe
        if self.lista_secciones.size() > 0:
            self.lista_secciones.selection_set(0)
            self.lista_secciones.activate(0)
            self.on_seccion_seleccionada()

    def actualizar_lista_notas(self):
        """Actualiza la lista de notas para la sección actual"""
        self.lista_notas.delete(0, tk.END)
        if not self.seccion_actual.get():
            return
            
        ruta_seccion = os.path.join("Registros", self.seccion_actual.get())
        if os.path.exists(ruta_seccion):
            notas = sorted([f for f in os.listdir(ruta_seccion) 
                          if f.endswith(".txt")], reverse=True)
            for nota in notas:
                # Mostrar solo el título (eliminando fecha y extensión)
                titulo = " ".join(nota.split("_")[2:]).replace(".txt", "")
                self.lista_notas.insert(tk.END, titulo)

    def on_seccion_seleccionada(self, event=None):
        """Maneja la selección de una sección"""
        seleccion = self.lista_secciones.curselection()
        if seleccion:
            self.seccion_actual.set(self.lista_secciones.get(seleccion[0]))
            self.actualizar_lista_notas()
            self.nueva_nota()  # Limpiar editor al cambiar de sección

    def on_nota_seleccionada(self, event=None):
        """Maneja la selección de una nota"""
        seleccion = self.lista_notas.curselection()
        if not seleccion or not self.seccion_actual.get():
            return
            
        # Obtener el nombre del archivo seleccionado
        titulo_nota = self.lista_notas.get(seleccion[0])
        ruta_seccion = os.path.join("Registros", self.seccion_actual.get())
        
        # Buscar el archivo correspondiente (puede haber múltiples con el mismo título)
        for archivo in os.listdir(ruta_seccion):
            if titulo_nota in archivo and archivo.endswith(".txt"):
                self.cargar_nota(os.path.join(ruta_seccion, archivo))
                break

    # def cargar_nota(self, ruta_nota):
    #     """Carga una nota en el editor"""
    #     try:
    #         with open(ruta_nota, "r", encoding="utf-8") as f:
    #             contenido = f.read()
            
    #         # Extraer título del nombre del archivo
    #         nombre_archivo = os.path.basename(ruta_nota)
    #         titulo = " ".join(nombre_archivo.split("_")[2:]).replace(".txt", "")
            
    #         # Actualizar la interfaz
    #         self.titulo_actual.set(titulo)
    #         self.text_contenido.delete("1.0", tk.END)
    #         self.text_contenido.insert("1.0", contenido.split("\n\n", 1)[-1])  # Saltar metadatos
            
    #         # Guardar referencia a la nota actual
    #         self.nota_actual.set(ruta_nota)
            
    #     except Exception as e:
    #         messagebox.showerror("Error", f"No se pudo cargar la nota:\n{str(e)}")

    def cargar_nota(self, ruta_nota):
        """Carga una nota en el editor - Versión mejorada para .exe"""
        try:
            # Debug: Mostrar información de rutas antes de empezar
            print("\n--- Inicio carga de nota ---")
            print(f"Ruta recibida: {ruta_nota}")
            print(f"Directorio actual: {os.getcwd()}")
            
            # Convertir a ruta absoluta de manera confiable
            if not os.path.isabs(ruta_nota):
                base_dir = os.path.dirname(sys.executable) if getattr(sys, 'frozen', False) else os.getcwd()
                ruta_nota = os.path.join(base_dir, ruta_nota)
            
            # Normalizar la ruta (para evitar problemas con / vs \)
            ruta_nota = os.path.normpath(ruta_nota)
            
            print(f"Ruta absoluta normalizada: {ruta_nota}")
            
            # Verificar si el archivo existe realmente
            if not os.path.exists(ruta_nota):
                error_msg = f"No se encontró el archivo:\n{ruta_nota}"
                print(error_msg)
                messagebox.showerror("Error", error_msg)
                return
                
            # Leer el archivo con manejo explícito de encoding
            try:
                with open(ruta_nota, "r", encoding="utf-8") as f:
                    contenido = f.read()
            except UnicodeDecodeError:
                # Intentar con otro encoding si utf-8 falla
                with open(ruta_nota, "r", encoding="latin-1") as f:
                    contenido = f.read()
            
            # Debug: Mostrar información del archivo
            print(f"Archivo encontrado. Tamaño: {len(contenido)} caracteres")
            print(f"Primeras líneas:\n{contenido[:200]}...")
            
            # Extraer título del nombre del archivo de manera más robusta
            nombre_archivo = os.path.basename(ruta_nota)
            try:
                # Intenta extraer el título después de la fecha
                partes = nombre_archivo.split('_')
                if len(partes) > 2:  # Si sigue el formato fecha_titulo.txt
                    titulo = ' '.join(partes[2:]).replace('.txt', '')
                else:
                    titulo = nombre_archivo.replace('.txt', '')
            except:
                titulo = nombre_archivo.replace('.txt', '')
            
            # Actualizar la interfaz
            self.titulo_actual.set(titulo)
            self.text_contenido.delete("1.0", tk.END)
            
            # Manejar diferentes formatos de contenido
            if "Sección:" in contenido and "Título:" in contenido and "Fecha:" in contenido:
                # Formato con metadatos (separados por doble salto de línea)
                partes = contenido.split("\n\n", 1)
                if len(partes) > 1:
                    self.text_contenido.insert("1.0", partes[1].strip())  # Contenido después de metadatos
                else:
                    self.text_contenido.insert("1.0", contenido.strip())
            else:
                # Formato simple sin metadatos
                self.text_contenido.insert("1.0", contenido.strip())
                
            # Guardar referencia a la nota actual
            self.nota_actual.set(ruta_nota)
            print("--- Nota cargada exitosamente ---\n")
            
        except PermissionError:
            error_msg = f"No tienes permisos para leer el archivo:\n{ruta_nota}"
            print(error_msg)
            messagebox.showerror("Error de Permisos", error_msg)
        except Exception as e:
            error_msg = f"No se pudo cargar la nota:\n{str(e)}"
            print(error_msg)
            messagebox.showerror("Error", error_msg)
    
    def crear_seccion(self):
        """Crea una nueva sección"""
        nombre = self.nueva_seccion.get().strip()
        
        if not nombre:
            messagebox.showwarning("Error", "Debe ingresar un nombre para la nueva sección.")
            return
        
        # Sanitizar nombre
        nombre = "".join(c for c in nombre if c.isalnum() or c in (" ", "_")).strip()
        nombre = nombre.replace(" ", "_")
        
        if not nombre:
            messagebox.showwarning("Error", "El nombre debe contener caracteres válidos.")
            return
            
        try:
            os.makedirs(os.path.join("Registros", nombre), exist_ok=True)
            messagebox.showinfo("Éxito", f"Sección '{nombre}' creada exitosamente!")
            self.nueva_seccion.set("")
            self.actualizar_lista_secciones()
            
            # Seleccionar la nueva sección
            items = self.lista_secciones.get(0, tk.END)
            if nombre in items:
                index = items.index(nombre)
                self.lista_secciones.selection_clear(0, tk.END)
                self.lista_secciones.selection_set(index)
                self.lista_secciones.activate(index)
                self.on_seccion_seleccionada()
                
        except Exception as e:
            messagebox.showerror("Error", f"Error al crear sección:\n{str(e)}")

    def nueva_nota(self):
        """Prepara el editor para una nueva nota"""
        self.titulo_actual.set("")
        self.text_contenido.delete("1.0", tk.END)
        self.nota_actual.set("")
        self.entry_titulo.focus_set()

    def guardar_nota(self):
        """Guarda la nota actual (nueva o existente)"""
        titulo = self.titulo_actual.get().strip()
        contenido = self.text_contenido.get("1.0", tk.END).strip()
        seccion = self.seccion_actual.get()
        
        if not titulo:
            messagebox.showwarning("Error", "El título no puede estar vacío.")
            return
            
        if not contenido:
            messagebox.showwarning("Error", "El contenido no puede estar vacío.")
            return
            
        # Determinar si es una nota nueva o existente
        ruta_nota = self.nota_actual.get()
        es_nueva = not ruta_nota
        
        if es_nueva:
            # Crear nombre de archivo con timestamp
            fecha = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            nombre_archivo = f"{fecha}_{titulo.replace(' ', '_')}.txt"
            nombre_archivo = "".join(c for c in nombre_archivo if c.isalnum() or c in ("_", "-", "."))
            ruta_nota = os.path.join("Registros", seccion, nombre_archivo)
        
        try:
            # Escribir archivo
            with open(ruta_nota, "w", encoding="utf-8") as f:
                f.write(f"Sección: {seccion}\n")
                f.write(f"Título: {titulo}\n")
                f.write(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                f.write(contenido)
            
            # Feedback al usuario
            messagebox.showinfo("Éxito", "Nota guardada correctamente!")
            
            # Actualizar listas
            if es_nueva:
                self.actualizar_lista_notas()
                # Seleccionar la nueva nota
                items = self.lista_notas.get(0, tk.END)
                if titulo in items:
                    index = items.index(titulo)
                    self.lista_notas.selection_clear(0, tk.END)
                    self.lista_notas.selection_set(index)
                    self.lista_notas.activate(index)
                    self.on_nota_seleccionada()
            
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo guardar la nota:\n{str(e)}")

    def eliminar_nota(self):
        """Elimina la nota actualmente seleccionada"""
        if not self.nota_actual.get():
            messagebox.showwarning("Advertencia", "No hay ninguna nota seleccionada para eliminar")
            return
            
        # Confirmar con el usuario
        confirmacion = messagebox.askyesno(
            "Confirmar eliminación",
            f"¿Estás seguro de que deseas eliminar esta nota?\n\nTítulo: {self.titulo_actual.get()}",
            icon="warning"
        )
        
        if not confirmacion:
            return
            
        try:
            # Eliminar el archivo
            os.remove(self.nota_actual.get())
            
            # Feedback al usuario
            messagebox.showinfo("Éxito", "Nota eliminada correctamente")
            
            # Actualizar la interfaz
            self.actualizar_lista_notas()
            self.nueva_nota()  # Limpiar el editor
            
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo eliminar la nota:\n{str(e)}")


if __name__ == "__main__":
    root = tk.Tk()
    app = DiarioApp(root)
    root.mainloop()