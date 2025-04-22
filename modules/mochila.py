import tkinter as tk
from tkinter import ttk, scrolledtext, filedialog, messagebox
import os
import json
import pdfkit
from datetime import datetime
from assets.estilos.styles import Styles
from assets.estilos.styles import ToolTip

class RichTextEditor(scrolledtext.ScrolledText):
    """Editor de texto enriquecido con capacidades básicas de formato"""
    def __init__(self, *args, **kwargs):
        self.parent = kwargs.pop('parent', None)
        super().__init__(*args, **kwargs)
        self._setup_tags()
        self._setup_keybindings()

    def _setup_tags(self):
        """Configura los estilos de formato disponibles"""
        self.tag_configure('heading1', font=('Helvetica', 18, 'bold'))
        self.tag_configure('heading2', font=('Helvetica', 16, 'bold'))
        self.tag_configure('bold', font=('Helvetica', 12, 'bold'))
        self.tag_configure('normal', font=('Helvetica', 12))
        
        # Configurar prioridad de tags (los más específicos primero)
        self.tag_lower('normal')
        self.tag_lower('bold')
        self.tag_lower('heading2')
        self.tag_lower('heading1')

    def _setup_keybindings(self):
        """Configura atajos de teclado para formato y funciones"""
        # Atajos de formato
        self.bind('<Control-b>', lambda e: self._toggle_format('bold') or "break")
        self.bind('<Control-B>', lambda e: self._toggle_format('bold') or "break")
        self.bind('<Control-Key-0>', lambda e: self._set_normal_text() or "break")
        self.bind('<Control-Key-1>', lambda e: self._toggle_format('heading1') or "break")
        self.bind('<Control-Key-2>', lambda e: self._toggle_format('heading2') or "break")
        self.bind('<Control-KP_0>', lambda e: self._set_normal_text() or "break")
        self.bind('<Control-KP_1>', lambda e: self._toggle_format('heading1') or "break")
        self.bind('<Control-KP_2>', lambda e: self._toggle_format('heading2') or "break")
        
        # Atajos de funciones
        if self.parent:
            self.bind('<Control-s>', lambda e: self.parent.save_note())
            self.bind('<Control-S>', lambda e: self.parent.save_note())
        
        self.bind('<Control-z>', lambda e: self.edit_undo() or "break")
        self.bind('<Control-Z>', lambda e: self.edit_undo() or "break")
        self.bind('<Control-y>', lambda e: self.edit_redo() or "break")
        self.bind('<Control-Y>', lambda e: self.edit_redo() or "break")

    def _set_normal_text(self):
        """Establece el texto seleccionado o línea actual como normal"""
        self._apply_format_to_line_or_selection('normal')

    def _toggle_format(self, format_type):
        """Alterna el formato especificado en la selección o línea actual"""
        current_line_tags = self._get_current_line_tags()
        
        # Si el formato ya está aplicado, quitarlo
        if format_type in current_line_tags:
            self._apply_format_to_line_or_selection('normal')
        else:
            self._apply_format_to_line_or_selection(format_type)

    def _get_current_line_tags(self):
        """Obtiene los tags de la línea actual"""
        line_start = self.index("insert linestart")
        line_end = self.index("insert lineend")
        
        # Obtener todos los tags en la línea actual
        tags_in_line = set()
        for tag in self.tag_names():
            ranges = self.tag_ranges(tag)
            for i in range(0, len(ranges), 2):
                start = ranges[i]
                end = ranges[i+1]
                if self.compare(start, '<=', line_end) and self.compare(end, '>=', line_start):
                    tags_in_line.add(tag)
        
        return tags_in_line

    def _apply_format_to_line_or_selection(self, format_type):
        """Aplica formato a la selección o a toda la línea actual"""
        try:
            # Si hay texto seleccionado, aplicar al texto seleccionado
            if self.tag_ranges("sel"):
                start = self.index("sel.first")
                end = self.index("sel.last")
            else:
                # Aplicar a toda la línea actual
                start = self.index("insert linestart")
                end = self.index("insert lineend")
            
            # Primero quitar todos los formatos existentes
            for tag in ['heading1', 'heading2', 'bold', 'normal']:
                self.tag_remove(tag, start, end)
            
            # Aplicar el nuevo formato (excepto para 'normal' que solo limpia)
            if format_type != 'normal':
                self.tag_add(format_type, start, end)
                
            # Mover el cursor al final de la línea para mejor experiencia de usuario
            self.mark_set("insert", end)
            
        except tk.TclError:
            pass  # No hay texto seleccionado o error en índices

    def get_json_content(self):
        """Convierte el contenido a formato JSON para guardar"""
        content = []
        for line in self.get("1.0", tk.END).split('\n'):
            if not line.strip():
                continue
                
            # Obtener tags de la primera posición de la línea
            line_start = self.search(line, "1.0", stopindex=tk.END)
            if line_start:
                tags = self.tag_names(line_start)
                line_type = 'normal'
                
                if 'heading1' in tags:
                    line_type = 'heading1'
                elif 'heading2' in tags:
                    line_type = 'heading2'
                elif 'bold' in tags:
                    line_type = 'bold'
                
                content.append({
                    'type': line_type,
                    'text': line
                })
        
        return content

    def load_json_content(self, content_data):
        """Carga contenido desde formato JSON"""
        self.delete("1.0", tk.END)
        for item in content_data:
            self.insert("end", item['text'] + '\n', item['type'])

    def get_html_content(self):
        """Genera HTML para exportación a PDF"""
        html_lines = []
        for line in self.get("1.0", tk.END).split('\n'):
            if not line.strip():
                continue
                
            line_start = self.search(line, "1.0", stopindex=tk.END)
            if line_start:
                tags = self.tag_names(line_start)
                
                if 'heading1' in tags:
                    html_lines.append(f"<h1>{line}</h1>")
                elif 'heading2' in tags:
                    html_lines.append(f"<h2>{line}</h2>")
                elif 'bold' in tags:
                    html_lines.append(f"<p><strong>{line}</strong></p>")
                else:
                    html_lines.append(f"<p>{line}</p>")
        
        return '\n'.join(html_lines)


class MochilaApp:
    """Aplicación principal para gestión de apuntes universitarios"""
    def __init__(self, root):
        self.root = root
        self.root.title("Mochila Universitaria")
        self.root.geometry("1200x800")
        
        Styles.apply_styles()
        Styles.apply_window_style(root)
        
        self._setup_variables()
        self._initialize_structure()
        self._build_interface()
        self._update_subjects_list()
        
    def _setup_variables(self):
        """Configura las variables de control"""
        self.current_subject = tk.StringVar()
        self.current_class = tk.StringVar(value=f"CLASE {datetime.now().strftime('%d-%m')}")
        self.selected_subject = None
        self.selected_class = None

    def _initialize_structure(self):
        """Crea la estructura inicial de directorios"""
        os.makedirs(os.path.join("Registros", "Mochila"), exist_ok=True)

    def _build_interface(self):
        """Construye la interfaz gráfica"""
        main_frame = ttk.Frame(self.root, style="Custom.TFrame")
        main_frame.pack(expand=True, fill="both", padx=20, pady=20)
        
        # Panel izquierdo (lista de materias y clases)
        left_panel = ttk.Frame(main_frame, style="Custom.TFrame", width=250)
        left_panel.pack(side="left", fill="y", padx=5)
        left_panel.pack_propagate(False)
        
        # Panel derecho (editor de apuntes)
        right_panel = ttk.Frame(main_frame, style="Custom.TFrame")
        right_panel.pack(side="right", expand=True, fill="both", padx=5)
        
        # Sección de materias
        self._build_subjects_section(left_panel)
        
        # Sección de clases
        self._build_classes_section(left_panel)
        
        # Editor de apuntes
        self._build_notes_editor(right_panel)
        
        # Botón de guardar en la parte inferior
        self._build_bottom_controls(right_panel)

    def _build_subjects_section(self, parent):
        """Construye la sección de materias"""
        frame = ttk.LabelFrame(parent, text="Materias", style="Custom.TLabelframe")
        frame.pack(fill="x", pady=5)
        
        # Añadir tooltip de ayuda
        label_help = tk.Label(frame, text=" ? ", font=("Segoe UI", 10, "bold"), 
                            fg=Styles.COLOR_BACKGROUND, cursor="question_arrow")
        label_help.pack(side="right", padx=(6, 0))

        ToolTip(label_help,
        """📚 Gestión de Materias:

        🔹 Crear nueva materia:
        1. Escribe el nombre de la materia (ej: "Matemáticas", "Historia")
        2. Haz clic en el botón "+" o presiona Enter en el campo de texto

        🔹 Eliminar materia:
        1. Selecciona una materia de la lista
        2. Haz clic en el botón "✖"
        ⚠️ Esto borrará TODAS las clases de esa materia
        
        📅 Gestión de Clases:
    
        🔹 Crear nueva clase:
        1. Selecciona una materia primero
        2. El nombre por defecto es "CLASE [fecha actual]"
        3. Haz clic en el botón "+" o presiona Enter en el campo de texto

        🔹 Eliminar clase:
        1. Selecciona una clase de la lista
        2. Haz clic en el botón "✖"
        ⚠️ Esto borrará la clase y sus apuntes
         
        📌 Atajos de teclado:
        - Ctrl+0: Texto normal
        - Ctrl+1: Título 1
        - Ctrl+2: Título 2
        - Ctrl+B: Negrita
        - Ctrl+S: Guardar apunte actual
        - Ctrl+Z: Deshacer
        - Ctrl+Y: Rehacer
        
        📝 Funciones:
        - Botón "💾 Guardar": Guarda el apunte actual
        - Botón "📤 Exportar PDF": Exporta el apunte a PDF
        
        👀 OJO (Enfoque máximo)
        - El navegar por otras materias o clases 
           no guarda los cambios automáticamente.
        - Usa el botón "💾 Guardar" o Ctrl+S para 
         guardar los cambios en el apunte actual.
        """)
        
        subject_entry = ttk.Entry(frame, textvariable=self.current_subject, style="Custom.TEntry")
        subject_entry.pack(fill="x", padx=5, pady=5)
        subject_entry.bind('<Return>', lambda e: self._create_subject())
        
        btn_frame = ttk.Frame(frame, style="Custom.TFrame")
        btn_frame.pack(fill="x", pady=5)
        
        ttk.Button(
            btn_frame, text="➕ Nueva", style="Custom.TButton",
            command=self._create_subject
        ).pack(side="left", expand=True)
        
        ttk.Button(
            btn_frame, text="✖ Eliminar", style="Custom.TButton",
            command=self._delete_subject
        ).pack(side="right", expand=True)
        
        self.subjects_list = tk.Listbox(
            parent,
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            selectbackground=Styles.COLOR_PRIMARY,
            font=Styles.FONT,
            borderwidth=0,
            highlightthickness=0,
            selectmode=tk.SINGLE
        )
        self.subjects_list.pack(expand=True, fill="both", pady=5)
        self.subjects_list.bind("<<ListboxSelect>>", self._on_subject_selected)

    def _build_classes_section(self, parent):
        """Construye la sección de clases"""
        frame = ttk.LabelFrame(parent, text="Clases", style="Custom.TLabelframe")
        frame.pack(fill="x", pady=5)
        
        class_entry = ttk.Entry(frame, textvariable=self.current_class, style="Custom.TEntry")
        class_entry.pack(fill="x", padx=5, pady=5)
        class_entry.bind('<Return>', lambda e: self._create_class())
        
        btn_frame = ttk.Frame(frame, style="Custom.TFrame")
        btn_frame.pack(fill="x", pady=5)
        
        ttk.Button(
            btn_frame, text="➕ Nueva", style="Custom.TButton",
            command=self._create_class
        ).pack(side="left", expand=True)
        
        ttk.Button(
            btn_frame, text="✖ Eliminar", style="Custom.TButton",
            command=self._delete_class
        ).pack(side="right", expand=True)
        
        self.classes_list = tk.Listbox(
            parent,
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            selectbackground=Styles.COLOR_PRIMARY,
            font=Styles.FONT,
            borderwidth=0,
            highlightthickness=0,
            selectmode=tk.SINGLE
        )
        self.classes_list.pack(expand=True, fill="both", pady=5)
        self.classes_list.bind("<<ListboxSelect>>", self._on_class_selected)

    def _build_notes_editor(self, parent):
        """Construye el editor de apuntes"""
        editor_frame = ttk.LabelFrame(parent, text="Apuntes", style="Custom.TLabelframe")
        editor_frame.pack(expand=True, fill="both")
        
        self.editor = RichTextEditor(
            editor_frame,
            wrap=tk.WORD,
            font=("Helvetica", 12),
            bg=Styles.COLOR_BACKGROUND,
            fg=Styles.COLOR_TEXT,
            insertbackground=Styles.COLOR_TEXT,
            padx=10,
            pady=10,
            undo=True,
            parent=self
        )
        self.editor.pack(expand=True, fill="both")

    def _build_bottom_controls(self, parent):
        """Construye los controles inferiores (guardar y exportar)"""
        bottom_frame = ttk.Frame(parent, style="Custom.TFrame")
        bottom_frame.pack(fill="x", pady=5)
        
        ttk.Button(
            bottom_frame, text="💾 Guardar", style="Accent.TButton",
            command=self._save_note
        ).pack(side="left", padx=5)
        
        ttk.Button(
            bottom_frame, text="📤 Exportar PDF", style="Custom.TButton",
            command=self._export_to_pdf
        ).pack(side="left", padx=5)

    def _on_subject_selected(self, event=None):
        """Maneja la selección de una materia"""
        selection = self.subjects_list.curselection()
        if selection:
            self.selected_subject = self.subjects_list.get(selection[0])
            self._load_classes()

    def _on_class_selected(self, event=None):
        """Maneja la selección de una clase"""
        selection = self.classes_list.curselection()
        if selection:
            self.selected_class = self.classes_list.get(selection[0])
            self._load_note()

    def _update_subjects_list(self):
        """Actualiza la lista de materias disponibles"""
        self.subjects_list.delete(0, tk.END)
        backpack_path = os.path.join("Registros", "Mochila")
        
        if os.path.exists(backpack_path):
            for subject in sorted(os.listdir(backpack_path)):
                if os.path.isdir(os.path.join(backpack_path, subject)):
                    self.subjects_list.insert(tk.END, subject)
        
        # Seleccionar la primera materia si existe
        if self.subjects_list.size() > 0:
            self.subjects_list.selection_set(0)
            self.subjects_list.activate(0)
            self._on_subject_selected()

    def _create_subject(self):
        """Crea una nueva materia"""
        subject = self.current_subject.get().strip()
        if not subject:
            messagebox.showwarning("Advertencia", "Debes ingresar un nombre para la materia")
            return
        
        subject_path = os.path.join("Registros", "Mochila", subject)
        try:
            os.makedirs(subject_path, exist_ok=True)
            self._update_subjects_list()
            self.current_subject.set("")
            
            # Seleccionar la nueva materia
            items = self.subjects_list.get(0, tk.END)
            if subject in items:
                index = items.index(subject)
                self.subjects_list.selection_clear(0, tk.END)
                self.subjects_list.selection_set(index)
                self.subjects_list.activate(index)
                self._on_subject_selected()
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo crear la materia:\n{str(e)}")

    def _delete_subject(self):
        """Elimina la materia seleccionada"""
        if not self.selected_subject:
            messagebox.showwarning("Advertencia", "Selecciona una materia primero")
            return
            
        if messagebox.askyesno(
            "Confirmar",
            f"¿Estás seguro de eliminar la materia '{self.selected_subject}' y todos sus apuntes?"
        ):
            try:
                subject_path = os.path.join("Registros", "Mochila", self.selected_subject)
                for root, dirs, files in os.walk(subject_path, topdown=False):
                    for name in files:
                        os.remove(os.path.join(root, name))
                    for name in dirs:
                        os.rmdir(os.path.join(root, name))
                os.rmdir(subject_path)
                
                self._update_subjects_list()
                self.classes_list.delete(0, tk.END)
                self.editor.delete("1.0", tk.END)
                
                self.selected_subject = None
                self.selected_class = None
            except Exception as e:
                messagebox.showerror("Error", f"No se pudo eliminar la materia:\n{str(e)}")

    def _load_classes(self):
        """Carga las clases de la materia seleccionada"""
        if not self.selected_subject:
            return
            
        self.classes_list.delete(0, tk.END)
        subject_path = os.path.join("Registros", "Mochila", self.selected_subject)
        
        if os.path.exists(subject_path):
            for file in sorted(os.listdir(subject_path)):
                if file.endswith(".json"):
                    self.classes_list.insert(tk.END, file[:-5])  # Quitar la extensión .json
        
        # Seleccionar la primera clase si existe
        if self.classes_list.size() > 0:
            self.classes_list.selection_set(0)
            self.classes_list.activate(0)
            self._on_class_selected()

    def _create_class(self):
        """Crea una nueva clase"""
        if not self.selected_subject:
            messagebox.showwarning("Advertencia", "Selecciona una materia primero")
            return
            
        class_name = self.current_class.get().strip()
        if not class_name:
            messagebox.showwarning("Advertencia", "Debes ingresar un nombre para la clase")
            return
            
        note_path = os.path.join("Registros", "Mochila", self.selected_subject, f"{class_name}.json")
        
        if os.path.exists(note_path) and not messagebox.askyesno(
            "Confirmar",
            f"El apunte '{class_name}' ya existe. ¿Deseas sobrescribirlo?"
        ):
            return
        
        try:
            with open(note_path, "w", encoding="utf-8") as f:
                json.dump([{"type": "heading1", "text": class_name}], f, indent=2)
            
            self._load_classes()
            
            # Seleccionar la nueva clase
            items = self.classes_list.get(0, tk.END)
            if class_name in items:
                index = items.index(class_name)
                self.classes_list.selection_clear(0, tk.END)
                self.classes_list.selection_set(index)
                self.classes_list.activate(index)
                self._on_class_selected()
            
            # Actualizar nombre para próxima clase
            self.current_class.set(f"CLASE {datetime.now().strftime('%d-%m')}")
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo crear el apunte:\n{str(e)}")

    def _delete_class(self):
        """Elimina la clase seleccionada"""
        if not self.selected_subject or not self.selected_class:
            messagebox.showwarning("Advertencia", "Selecciona una materia y una clase primero")
            return
            
        if messagebox.askyesno(
            "Confirmar",
            f"¿Estás seguro de eliminar el apunte '{self.selected_class}'?"
        ):
            try:
                note_path = os.path.join("Registros", "Mochila", self.selected_subject, f"{self.selected_class}.json")
                os.remove(note_path)
                
                self._load_classes()
                self.editor.delete("1.0", tk.END)
                
                self.selected_class = None
            except Exception as e:
                messagebox.showerror("Error", f"No se pudo eliminar el apunte:\n{str(e)}")

    def _load_note(self):
        """Carga el apunte seleccionado"""
        if not self.selected_subject or not self.selected_class:
            return
            
        note_path = os.path.join("Registros", "Mochila", self.selected_subject, f"{self.selected_class}.json")
        
        try:
            if os.path.exists(note_path):
                with open(note_path, "r", encoding="utf-8") as f:
                    content = json.load(f)
                self.editor.load_json_content(content)
            else:
                # Si no existe, crear un apunte nuevo con un título
                self.editor.delete("1.0", tk.END)
                self.editor.insert("end", f"{self.selected_class}\n", "heading1")
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo cargar el apunte:\n{str(e)}")

    def _save_note(self):
        """Guarda el apunte actual"""
        if not self.selected_subject or not self.selected_class:
            messagebox.showwarning("Advertencia", "Selecciona una materia y una clase primero")
            return
            
        note_path = os.path.join("Registros", "Mochila", self.selected_subject, f"{self.selected_class}.json")
        content = self.editor.get_json_content()
        
        try:
            with open(note_path, "w", encoding="utf-8") as f:
                json.dump(content, f, indent=2, ensure_ascii=False)
            
            messagebox.showinfo("Guardado", f"Apunte '{self.selected_class}' guardado correctamente")
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo guardar el apunte:\n{str(e)}")

    def _export_to_pdf(self):
        """Exporta el apunte actual a PDF"""
        if not self.selected_subject or not self.selected_class:
            messagebox.showwarning("Advertencia", "Selecciona una materia y una clase primero")
            return
            
        try:
            html = self.editor.get_html_content()
            
            styled_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>{self.selected_class} - {self.selected_subject}</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; margin: 2cm; }}
                    h1 {{ color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 5px; }}
                    h2 {{ color: #34495e; }}
                    strong {{ font-weight: bold; }}
                    p {{ margin: 0.5em 0; }}
                </style>
            </head>
            <body>
                <h1>{self.selected_class}</h1>
                <h2>{self.selected_subject}</h2>
                {html}
                <footer style="margin-top: 20px; font-size: 0.8em; text-align: right;">
                    Generado con Mochila Universitaria - {datetime.now().strftime('%d/%m/%Y %H:%M')}
                </footer>
            </body>
            </html>
            """
            
            pdf_path = filedialog.asksaveasfilename(
                defaultextension=".pdf",
                filetypes=[("PDF Files", "*.pdf")],
                initialfile=f"{self.selected_subject}_{self.selected_class}.pdf"
            )
            
            if pdf_path:
                pdfkit.from_string(styled_html, pdf_path)
                messagebox.showinfo("Éxito", f"PDF exportado correctamente a:\n{pdf_path}")
                
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo exportar a PDF:\n{str(e)}")

    def save_note(self):
        """Método público para guardar notas (usado por el editor)"""
        self._save_note()


def main():
    root = tk.Tk()
    app = MochilaApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()