import tkinter as tk
from tkinter import ttk, scrolledtext, filedialog, messagebox
import os
import markdown
from datetime import datetime
import pdfkit
from styles import Styles


class MochilaApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Mochila Universitaria")
        self.root.geometry("1200x800")
        
        Styles.apply_styles()
        Styles.apply_window_style(root)
        
        self.materia_actual = tk.StringVar()
        self.clase_actual = tk.StringVar(value=f"CLASE {datetime.now().strftime('%d-%m')}")
        self.contenido_apunte = tk.StringVar()
        
        self.inicializar_estructura()
        self.construir_interfaz()
        self.actualizar_lista_materias()
        
        # Variables para mantener el seguimiento de las selecciones
        self.materia_seleccionada = None
        self.clase_seleccionada = None

    def inicializar_estructura(self):
        """Crea la estructura inicial de directorios"""
        if not os.path.exists("Registros"):
            os.makedirs("Registros")
        if not os.path.exists(os.path.join("Registros", "Mochila")):
            os.makedirs(os.path.join("Registros", "Mochila"))

    def construir_interfaz(self):
        """Construye la interfaz gráfica"""
        # Frame principal
        main_frame = ttk.Frame(self.root, style="Custom.TFrame")
        main_frame.pack(expand=True, fill="both", padx=20, pady=20)
        
        # Panel izquierdo (lista de materias y clases)
        panel_izquierdo = ttk.Frame(main_frame, style="Custom.TFrame", width=250)
        panel_izquierdo.pack(side="left", fill="y", padx=5)
        panel_izquierdo.pack_propagate(False)
        
        # Panel derecho (editor de apuntes)
        panel_derecho = ttk.Frame(main_frame, style="Custom.TFrame")
        panel_derecho.pack(side="right", expand=True, fill="both", padx=5)
        
        # Controles de materia
        materia_frame = ttk.LabelFrame(panel_izquierdo, text="Materias", style="Custom.TLabelframe")
        materia_frame.pack(fill="x", pady=5)
        
        ttk.Entry(materia_frame, textvariable=self.materia_actual, style="Custom.TEntry").pack(fill="x", padx=5, pady=5)
        
        btn_frame = ttk.Frame(materia_frame, style="Custom.TFrame")
        btn_frame.pack(fill="x", pady=5)
        
        ttk.Button(
            btn_frame,
            text="➕ Nueva",
            style="Custom.TButton",
            command=self.crear_materia
        ).pack(side="left", expand=True)
        
        ttk.Button(
            btn_frame,
            text="✖ Eliminar",
            style="Custom.TButton",
            command=self.eliminar_materia
        ).pack(side="right", expand=True)
        
        # Lista de materias
        self.lista_materias = tk.Listbox(
            panel_izquierdo,
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            selectbackground=Styles.COLOR_PRIMARY,
            font=Styles.FONT,
            borderwidth=0,
            highlightthickness=0,
            selectmode=tk.SINGLE
        )
        self.lista_materias.pack(expand=True, fill="both", pady=5)
        self.lista_materias.bind("<<ListboxSelect>>", self.on_materia_seleccionada)
        
        # Controles de clase
        clase_frame = ttk.LabelFrame(panel_izquierdo, text="Clases", style="Custom.TLabelframe")
        clase_frame.pack(fill="x", pady=5)
        
        ttk.Entry(clase_frame, textvariable=self.clase_actual, style="Custom.TEntry").pack(fill="x", padx=5, pady=5)
        
        btn_frame_clase = ttk.Frame(clase_frame, style="Custom.TFrame")
        btn_frame_clase.pack(fill="x", pady=5)
        
        ttk.Button(
            btn_frame_clase,
            text="➕ Nueva",
            style="Custom.TButton",
            command=self.crear_clase
        ).pack(side="left", expand=True)
        
        ttk.Button(
            btn_frame_clase,
            text="✖ Eliminar",
            style="Custom.TButton",
            command=self.eliminar_clase
        ).pack(side="right", expand=True)
        
        # Lista de clases
        self.lista_clases = tk.Listbox(
            panel_izquierdo,
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            selectbackground=Styles.COLOR_PRIMARY,
            font=Styles.FONT,
            borderwidth=0,
            highlightthickness=0,
            selectmode=tk.SINGLE
        )
        self.lista_clases.pack(expand=True, fill="both", pady=5)
        self.lista_clases.bind("<<ListboxSelect>>", self.on_clase_seleccionada)
        
        # Editor de apuntes
        editor_frame = ttk.LabelFrame(panel_derecho, text="Apuntes", style="Custom.TLabelframe")
        editor_frame.pack(expand=True, fill="both")
        
        notebook = ttk.Notebook(editor_frame, style="Custom.TNotebook")
        notebook.pack(expand=True, fill="both")
        
        # Pestaña de edición (Markdown)
        edit_tab = ttk.Frame(notebook, style="Custom.TFrame")
        notebook.add(edit_tab, text="Editar")
        
        self.editor = scrolledtext.ScrolledText(
            edit_tab,
            wrap=tk.WORD,
            font=("Consolas", 12),
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            insertbackground=Styles.COLOR_TEXT,
            padx=10,
            pady=10
        )
        self.editor.pack(expand=True, fill="both")
        
        # Pestaña de vista previa (HTML renderizado)
        preview_tab = ttk.Frame(notebook, style="Custom.TFrame")
        notebook.add(preview_tab, text="Vista Previa")
        
        self.preview = scrolledtext.ScrolledText(
            preview_tab,
            wrap=tk.WORD,
            font=Styles.FONT,
            bg="white",
            fg="black",
            state="disabled",
            padx=10,
            pady=10
        )
        self.preview.pack(expand=True, fill="both")
        
        self.editor.bind("<KeyRelease>", self.actualizar_vista_previa)
        
        # Barra de herramientas
        toolbar_frame = ttk.Frame(panel_derecho, style="Custom.TFrame")
        toolbar_frame.pack(fill="x", pady=5)
        
        ttk.Button(
            toolbar_frame,
            text="💾 Guardar Apunte",
            style="Accent.TButton",
            command=self.guardar_apunte
        ).pack(side="left", padx=5)
        
        ttk.Button(
            toolbar_frame,
            text="📤 Exportar a PDF",
            style="Custom.TButton",
            command=self.exportar_a_pdf
        ).pack(side="left", padx=5)
        
        # Botones de formato
        formatos = [
            ("# H1", "# ", ""),
            ("## H2", "## ", ""),
            ("**B**", "**", "**"),
            ("*I*", "*", "*"),
            ("- Lista", "- ", "", True),
            ("``` Código", "```\n", "\n```", True)
        ]
        
        for texto, prefijo, sufijo, *args in formatos:
            newline = args[0] if args else False
            ttk.Button(
                toolbar_frame,
                text=texto,
                style="Custom.TButton",
                command=lambda p=prefijo, s=sufijo, nl=newline: self.insertar_formato(p, s, nl)
            ).pack(side="left", padx=2)

    def on_materia_seleccionada(self, event=None):
        """Maneja la selección de una materia"""
        seleccion = self.lista_materias.curselection()
        if seleccion:
            self.materia_seleccionada = self.lista_materias.get(seleccion[0])
            self.cargar_clases_materia()

    def on_clase_seleccionada(self, event=None):
        """Maneja la selección de una clase"""
        seleccion = self.lista_clases.curselection()
        if seleccion:
            self.clase_seleccionada = self.lista_clases.get(seleccion[0])
            self.cargar_apunte()

    def insertar_formato(self, prefix, suffix="", newline=False):
        """Inserta formato Markdown en el editor"""
        try:
            # Verificar si hay texto seleccionado
            if self.editor.tag_ranges("sel"):
                start = self.editor.index("sel.first")
                end = self.editor.index("sel.last")
                selected_text = self.editor.get(start, end)
                
                # Insertar el formato alrededor del texto seleccionado
                self.editor.delete(start, end)
                self.editor.insert(start, f"{prefix}{selected_text}{suffix}")
                
                # Posicionar el cursor después del texto formateado
                self.editor.mark_set("insert", f"{start}+{len(prefix + selected_text + suffix)}c")
            else:
                # No hay texto seleccionado, insertar marcadores
                pos = self.editor.index("insert")
                self.editor.insert(pos, f"{prefix}{suffix}")
                
                # Posicionar el cursor entre los marcadores
                if prefix and suffix:
                    self.editor.mark_set("insert", f"{pos}+{len(prefix)}c")
                
                # Agregar nueva línea si es necesario
                if newline:
                    self.editor.insert("insert", "\n")
        except Exception as e:
            messagebox.showerror("Error", f"Error al aplicar formato:\n{str(e)}")
        
        self.actualizar_vista_previa()

    def actualizar_vista_previa(self, event=None):
        """Actualiza la vista previa del Markdown"""
        try:
            markdown_text = self.editor.get("1.0", tk.END)
            html = markdown.markdown(markdown_text)
            
            self.preview.config(state="normal")
            self.preview.delete("1.0", tk.END)
            self.preview.insert(tk.END, html)
            self.preview.config(state="disabled")
        except Exception as e:
            print(f"Error al actualizar vista previa: {str(e)}")

    def actualizar_lista_materias(self):
        """Actualiza la lista de materias disponibles"""
        self.lista_materias.delete(0, tk.END)
        ruta_mochila = os.path.join("Registros", "Mochila")
        
        if os.path.exists(ruta_mochila):
            for materia in sorted(os.listdir(ruta_mochila)):
                if os.path.isdir(os.path.join(ruta_mochila, materia)):
                    self.lista_materias.insert(tk.END, materia)
        
        # Seleccionar la primera materia si existe
        if self.lista_materias.size() > 0:
            self.lista_materias.selection_set(0)
            self.lista_materias.activate(0)
            self.on_materia_seleccionada()

    def crear_materia(self):
        """Crea una nueva materia"""
        materia = self.materia_actual.get().strip()
        if not materia:
            messagebox.showwarning("Advertencia", "Debes ingresar un nombre para la materia")
            return
        
        ruta_materia = os.path.join("Registros", "Mochila", materia)
        try:
            os.makedirs(ruta_materia, exist_ok=True)
            self.actualizar_lista_materias()
            self.materia_actual.set("")
            
            # Seleccionar la nueva materia
            items = self.lista_materias.get(0, tk.END)
            if materia in items:
                index = items.index(materia)
                self.lista_materias.selection_clear(0, tk.END)
                self.lista_materias.selection_set(index)
                self.lista_materias.activate(index)
                self.on_materia_seleccionada()
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo crear la materia:\n{str(e)}")

    def eliminar_materia(self):
        """Elimina la materia seleccionada"""
        if not self.materia_seleccionada:
            messagebox.showwarning("Advertencia", "Selecciona una materia primero")
            return
            
        respuesta = messagebox.askyesno(
            "Confirmar",
            f"¿Estás seguro de eliminar la materia '{self.materia_seleccionada}' y todos sus apuntes?"
        )
        
        if respuesta:
            try:
                ruta_materia = os.path.join("Registros", "Mochila", self.materia_seleccionada)
                # Eliminar todo el contenido de la materia
                for root, dirs, files in os.walk(ruta_materia, topdown=False):
                    for name in files:
                        os.remove(os.path.join(root, name))
                    for name in dirs:
                        os.rmdir(os.path.join(root, name))
                os.rmdir(ruta_materia)
                
                # Actualizar la interfaz
                self.actualizar_lista_materias()
                self.lista_clases.delete(0, tk.END)
                self.editor.delete("1.0", tk.END)
                self.preview.config(state="normal")
                self.preview.delete("1.0", tk.END)
                self.preview.config(state="disabled")
                
                # Limpiar selecciones
                self.materia_seleccionada = None
                self.clase_seleccionada = None
            except Exception as e:
                messagebox.showerror("Error", f"No se pudo eliminar la materia:\n{str(e)}")

    def cargar_clases_materia(self):
        """Carga las clases de la materia seleccionada"""
        if not self.materia_seleccionada:
            return
            
        self.lista_clases.delete(0, tk.END)
        ruta_materia = os.path.join("Registros", "Mochila", self.materia_seleccionada)
        
        if os.path.exists(ruta_materia):
            for archivo in sorted(os.listdir(ruta_materia)):
                if archivo.endswith(".md"):
                    self.lista_clases.insert(tk.END, archivo[:-3])  # Quitar la extensión .md
        
        # Seleccionar la primera clase si existe
        if self.lista_clases.size() > 0:
            self.lista_clases.selection_set(0)
            self.lista_clases.activate(0)
            self.on_clase_seleccionada()

    def crear_clase(self):
        """Crea una nueva clase"""
        if not self.materia_seleccionada:
            messagebox.showwarning("Advertencia", "Selecciona una materia primero")
            return
            
        clase = self.clase_actual.get().strip()
        if not clase:
            messagebox.showwarning("Advertencia", "Debes ingresar un nombre para la clase")
            return
            
        ruta_apunte = os.path.join("Registros", "Mochila", self.materia_seleccionada, f"{clase}.md")
        
        # Si el archivo ya existe, preguntar si sobrescribir
        if os.path.exists(ruta_apunte):
            respuesta = messagebox.askyesno(
                "Confirmar",
                f"El apunte '{clase}' ya existe. ¿Deseas sobrescribirlo?"
            )
            if not respuesta:
                return
        
        try:
            with open(ruta_apunte, "w", encoding="utf-8") as f:
                f.write(f"# {clase}\n\n")
            
            # Actualizar lista de clases
            self.cargar_clases_materia()
            
            # Seleccionar la nueva clase
            items = self.lista_clases.get(0, tk.END)
            if clase in items:
                index = items.index(clase)
                self.lista_clases.selection_clear(0, tk.END)
                self.lista_clases.selection_set(index)
                self.lista_clases.activate(index)
                self.on_clase_seleccionada()
            
            # Actualizar nombre para próxima clase
            self.clase_actual.set(f"CLASE {datetime.now().strftime('%d-%m')}")
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo crear el apunte:\n{str(e)}")

    def eliminar_clase(self):
        """Elimina la clase seleccionada"""
        if not self.materia_seleccionada or not self.clase_seleccionada:
            messagebox.showwarning("Advertencia", "Selecciona una materia y una clase primero")
            return
            
        respuesta = messagebox.askyesno(
            "Confirmar",
            f"¿Estás seguro de eliminar el apunte '{self.clase_seleccionada}'?"
        )
        
        if respuesta:
            try:
                ruta_apunte = os.path.join("Registros", "Mochila", self.materia_seleccionada, f"{self.clase_seleccionada}.md")
                os.remove(ruta_apunte)
                
                # Actualizar la interfaz
                self.cargar_clases_materia()
                self.editor.delete("1.0", tk.END)
                self.preview.config(state="normal")
                self.preview.delete("1.0", tk.END)
                self.preview.config(state="disabled")
                
                # Limpiar selección de clase
                self.clase_seleccionada = None
            except Exception as e:
                messagebox.showerror("Error", f"No se pudo eliminar el apunte:\n{str(e)}")

    def cargar_apunte(self):
        """Carga el apunte seleccionado en el editor"""
        if not self.materia_seleccionada or not self.clase_seleccionada:
            return
            
        ruta_apunte = os.path.join("Registros", "Mochila", self.materia_seleccionada, f"{self.clase_seleccionada}.md")
        
        try:
            with open(ruta_apunte, "r", encoding="utf-8") as f:
                contenido = f.read()
            
            self.editor.delete("1.0", tk.END)
            self.editor.insert("1.0", contenido)
            self.actualizar_vista_previa()
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo cargar el apunte:\n{str(e)}")

    def guardar_apunte(self):
        """Guarda el apunte actual"""
        if not self.materia_seleccionada or not self.clase_seleccionada:
            messagebox.showwarning("Advertencia", "Selecciona una materia y una clase primero")
            return
            
        ruta_apunte = os.path.join("Registros", "Mochila", self.materia_seleccionada, f"{self.clase_seleccionada}.md")
        contenido = self.editor.get("1.0", tk.END)
        
        try:
            with open(ruta_apunte, "w", encoding="utf-8") as f:
                f.write(contenido)
            
            messagebox.showinfo("Guardado", f"Apunte '{self.clase_seleccionada}' guardado correctamente")
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo guardar el apunte:\n{str(e)}")

    def exportar_a_pdf(self):
        """Exporta el apunte actual a PDF"""
        if not self.materia_seleccionada or not self.clase_seleccionada:
            messagebox.showwarning("Advertencia", "Selecciona una materia y una clase primero")
            return
            
        ruta_apunte = os.path.join("Registros", "Mochila", self.materia_seleccionada, f"{self.clase_seleccionada}.md")
        
        if not os.path.exists(ruta_apunte):
            messagebox.showerror("Error", f"El archivo {ruta_apunte} no existe")
            return

        try:
            with open(ruta_apunte, "r", encoding="utf-8") as f:
                markdown_text = f.read()
                
            html = markdown.markdown(markdown_text)
            
            styled_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>{self.clase_seleccionada} - {self.materia_seleccionada}</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }}
                    h1, h2, h3 {{ color: #2c3e50; }}
                    code {{ background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }}
                    pre {{ background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }}
                    blockquote {{ border-left: 3px solid #2c3e50; padding-left: 10px; margin-left: 0; color: #555; }}
                </style>
            </head>
            <body>
                <h1>{self.clase_seleccionada}</h1>
                <h2>{self.materia_seleccionada}</h2>
                {html}
            </body>
            </html>
            """
            
            ruta_pdf = filedialog.asksaveasfilename(
                defaultextension=".pdf",
                filetypes=[("PDF Files", "*.pdf")],
                initialfile=f"{self.materia_seleccionada}_{self.clase_seleccionada}.pdf"
            )
            
            if ruta_pdf:  # Si el usuario no canceló
                pdfkit.from_string(styled_html, ruta_pdf)
                messagebox.showinfo("Éxito", f"PDF exportado correctamente a:\n{ruta_pdf}")
                
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo exportar a PDF:\n{str(e)}")
            