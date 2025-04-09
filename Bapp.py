import tkinter as tk
from tkinter import ttk
from splash import SplashScreen
from styles import Styles
from modules.diario import DiarioApp
from modules.gimnasio import GimnasioApp
from modules.mochila import MochilaApp

class MainApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Mi Aplicación Personal")
        self.ventana_secundaria_abierta = False
        
        # Configuración inicial de la ventana
        self.setup_window()
        
        # Aplicar estilos globales
        Styles.apply_styles()
        Styles.apply_window_style(root)
        
        # Crear widgets principales
        self.create_widgets()
        
        # Configurar eventos de teclado
        self.setup_keybindings()
        
        # Asegurar que la ventana esté completamente cargada
        self.root.after(100, self.finalize_setup)
    
    def setup_window(self):
        """Configura la ventana principal"""
        self.root.geometry("400x600")
        self.center_window(400, 600)
        self.root.minsize(350, 550)  # Tamaño mínimo para mantener legibilidad
        self.root.iconbitmap('icon.ico') if hasattr(tk, 'iconbitmap') else None
    
    def finalize_setup(self):
        """Finaliza la configuración después de que la ventana esté lista"""
        # Puedes añadir aquí cualquier inicialización que necesite la ventana visible
        self.root.focus_force()
    
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
    
    def setup_keybindings(self):
        """Configura los atajos de teclado"""
        self.root.bind("<F11>", self.toggle_maximize)
        self.root.bind("<Escape>", self.exit_app)
        self.root.bind("<Control-q>", self.exit_app)
    
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
        
        # Botones de las funcionalidades
        self.create_buttons()
    
    def create_buttons(self):
        """Crea los botones de la aplicación"""
        button_options = {
            'style': "Accent.TButton",
            'width': 30,
            'padding': (30, 20)
        }
        
        # Botón para abrir el diario
        self.btn_diario = ttk.Button(
            self.main_frame,
            text="📓 Abrir Diario Personal",
            command=self.abrir_diario,
            **button_options
        )
        self.btn_diario.pack(pady=10)
        
        # Botón para abrir la mochila
        self.btn_mochila = ttk.Button(
            self.main_frame,
            text="🎒 Abrir Mochila",
            command=self.abrir_mochila,
            **button_options
        )
        self.btn_mochila.pack(pady=10)
        
        # Botón para abrir el gimnasio
        self.btn_gimnasio = ttk.Button(
            self.main_frame,
            text="🏋️ Abrir Registro de Gimnasio",
            command=self.abrir_gimnasio,
            **button_options
        )
        self.btn_gimnasio.pack(pady=10)
        
        # Botón de salida
        self.btn_salir = ttk.Button(
            self.main_frame,
            text="🚪 Salir",
            style="Custom.TButton",
            command=self.root.quit,
            width=19,
            padding=(30, 20)
        )
        self.btn_salir.pack(pady=10)

    def abrir_ventana_secundaria(self, titulo, app_class):
        """Método genérico para abrir ventanas secundarias"""
        if self.ventana_secundaria_abierta:
            return
            
        self.ventana_secundaria_abierta = True
        self.root.withdraw()  # Oculta la ventana principal
        
        # Crear ventana secundaria
        secundaria = tk.Toplevel()
        secundaria.title(titulo)
        
        # Configurar ventana
        secundaria.state("zoomed")
        secundaria.focus_force()
        
        # Configurar cierre seguro
        secundaria.protocol("WM_DELETE_WINDOW", 
                          lambda: self.cerrar_ventana_secundaria(secundaria))
        
        # Instanciar la aplicación secundaria
        app_instance = app_class(secundaria)
        
        # Guardar referencia
        setattr(self, f'app_{titulo.lower().replace(" ", "_")}', app_instance)
        setattr(self, f'ventana_{titulo.lower().replace(" ", "_")}', secundaria)
        
        return secundaria

    def cerrar_ventana_secundaria(self, ventana):
        """Cierra la ventana secundaria y muestra la principal"""
        # Destruir la ventana secundaria
        ventana.destroy()
        
        # Mostrar la ventana principal
        self.root.deiconify()
        self.ventana_secundaria_abierta = False
        
        # Enfocar la ventana principal
        self.root.focus_force()

    def abrir_diario(self):
        """Abre la ventana del diario"""
        self.abrir_ventana_secundaria("Diario Personal", DiarioApp)

    def abrir_mochila(self):
        """Abre la ventana de la mochila"""
        self.abrir_ventana_secundaria("Mochila", MochilaApp)

    def abrir_gimnasio(self):
        """Abre la ventana del gimnasio"""
        self.abrir_ventana_secundaria("Registro de Gimnasio", GimnasioApp)

    def toggle_maximize(self, event=None):
        """Alternar modo maximizado"""
        if self.root.state() == "zoomed":
            self.root.state("normal")
            self.center_window(400, 600)  # Volver al tamaño original
        else:
            self.root.state("zoomed")
        return "break"

    def exit_app(self, event=None):
        """Salir de la aplicación con Escape"""
        self.root.quit()
        return "break"
    
def main():
    root = tk.Tk()
    root.withdraw()  # Ocultar la ventana principal
    
    def start_main_app():
        try:
            # Pequeño delay adicional para asegurar que el splash se cerró
            root.after(100, lambda: root.deiconify()) 
            app = MainApp(root)
        except Exception as e:
            print(f"Error al iniciar la aplicación: {e}")
            root.destroy()
    
    # Mostrar splash screen
    splash = SplashScreen(root, on_complete=start_main_app)
    
    root.mainloop()

if __name__ == "__main__":
    main()