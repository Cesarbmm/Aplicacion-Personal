import tkinter as tk
from tkinter import ttk
from styles import Styles
from modules.diario import DiarioApp
from modules.gimnasio import GimnasioApp
from modules.mochila import MochilaApp

class MainApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Mi Aplicación Personal")
        
        # Configuración de ventana maximizada al abrir
        self.center_window(400,600) # Maximiza la ventana
        
        # Atajos de teclado para alternar maximización y salida
        self.root.bind("<F11>", self.toggle_maximize)
        self.root.bind("<Escape>", self.exit_app)
        
        # Aplicar estilos globales
        Styles.apply_styles()
        Styles.apply_window_style(root)
        
        self.create_widgets()
        
    def center_window(self, width, height):
       """Centra la ventana en la pantalla"""
       # Obtener dimensiones de la pantalla
       screen_width = self.root.winfo_screenwidth()
       screen_height = self.root.winfo_screenheight()
       
       # Calcular posición x, y para centrar la ventana
       x = (screen_width // 2) - (width // 2)
       y = (screen_height // 2) - (height // 2)
       
       # Establecer geometría de la ventana
       self.root.geometry(f'{width}x{height}+{x}+{y}')

    def create_widgets(self):
        """Crea los widgets principales de la ventana"""
        # Frame principal centrado
        self.main_frame = ttk.Frame(self.root, style="Custom.TFrame")
        self.main_frame.place(relx=0.5, rely=0.5, anchor="center")
        
        # Título de la aplicación
        self.lbl_titulo = ttk.Label(
            self.main_frame, 
            text="Mi Aplicación Personal", 
            style="Custom.Header.TLabel"
        )
        self.lbl_titulo.pack(pady=(0, 30))
        
        # Botón para abrir el diario (más grande)
        self.btn_diario = ttk.Button(
            self.main_frame,
            text="📓 Abrir Diario Personal",
            style="Accent.TButton",
            command=self.abrir_diario,
            width=30
        )
        self.btn_diario.pack(pady=10, ipadx=30, ipady=20)
        
        self.btn_mochila = ttk.Button(
            self.main_frame,
            text="🎒 Abrir Mochila",
            style="Accent.TButton",
            command=self.abrir_mochila,
            width=30
        )
        self.btn_mochila.pack(pady=10, ipadx=30, ipady=20)
        
  
    # Dentro de MainApp.create_widgets()
        self.btn_gimnasio = ttk.Button(
            self.main_frame,
            text="🏋️ Abrir Registro de Gimnasio",
            style="Accent.TButton",
            command=self.abrir_gimnasio,
            width=30
        )
        self.btn_gimnasio.pack(pady=10, ipadx=30, ipady=20)
        
        # Botón de salida
        self.btn_salir = ttk.Button(
            self.main_frame,
            text="🚪 Salir",
            style="Custom.TButton",
            command=self.root.quit,
            width=19
        )
        self.btn_salir.pack(pady=10, ipadx=30, ipady=20)

        # Y el método correspondiente
    def abrir_gimnasio(self):
            """Abre la ventana del gimnasio"""
            gimnasio_window = tk.Toplevel(self.root)
            gimnasio_window.state("zoomed")
            gimnasio_window.transient(self.root)
            gimnasio_window.grab_set()

            self.gimnasio_app = GimnasioApp(gimnasio_window)

            gimnasio_window.protocol("WM_DELETE_WINDOW", 
                                   lambda: self.cerrar_gimnasio(gimnasio_window))

    def cerrar_gimnasio(self, window):
            """Cierra la ventana del gimnasio"""
            window.grab_release()
            window.destroy()
            
    def abrir_mochila(self):
            """Abre la ventana del gimnasio"""
            mochila_window = tk.Toplevel(self.root)
            mochila_window.state("zoomed")
            mochila_window.transient(self.root)
            mochila_window.grab_set()

            self.mochila_app = MochilaApp(mochila_window)

            mochila_window.protocol("WM_DELETE_WINDOW", 
                                   lambda: self.cerrar_gimnasio(mochila_window))

    def cerrar_mochila(self, window):
            """Cierra la ventana del gimnasio"""
            window.grab_release()
            window.destroy()        

    def abrir_diario(self):
        """Abre la ventana del diario personal maximizada"""
        # Crear nueva ventana para el diario
        diario_window = tk.Toplevel(self.root)
        diario_window.state("zoomed")  # Maximiza la ventana
        diario_window.transient(self.root)
        diario_window.grab_set()  # Hace que la ventana sea modal
        
        # Instanciar la aplicación del diario
        self.diario_app = DiarioApp(diario_window)
        
        # Configurar qué hacer al cerrar la ventana del diario
        diario_window.protocol("WM_DELETE_WINDOW", 
                             lambda: self.cerrar_diario(diario_window))

    def cerrar_diario(self, window):
        """Cierra la ventana del diario"""
        window.grab_release()
        window.destroy()

    def toggle_maximize(self, event=None):
        """Alternar modo maximizado"""
        if self.root.state() == "zoomed":
            self.root.state("normal")
        else:
            self.root.state("zoomed")
        return "break"

    def exit_app(self, event=None):
        """Salir de la aplicación con Escape"""
        self.root.quit()
        return "break"

def main():
    root = tk.Tk()
    app = MainApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
