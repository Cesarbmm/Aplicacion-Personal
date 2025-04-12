import tkinter as tk
from PIL import Image, ImageTk
from assets.estilos.styles import Styles
import random

class SplashScreen:
    def __init__(self, root, on_complete=None):
        """
        Splash minimalista que solo muestra el logo con efecto de desvanecimiento
        """
        self.root = root
        self.on_complete = on_complete
        
        # Crear ventana transparente
        self.splash = tk.Toplevel(root)
        self.splash.overrideredirect(True)
        self.splash.attributes("-transparentcolor", "black")  # Usar blanco como color transparente
        self.splash.attributes("-topmost", True)
        
        # Cargar imagen del logo
        self.load_logo_image()
        
        # Configurar tamaño de ventana según el logo
        self.width = self.logo_img.width()
        self.height = self.logo_img.height()
        
        # Centrar ventana
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        x = (screen_width - self.width) // 2
        y = (screen_height - self.height) // 2
        self.splash.geometry(f"{self.width}x{self.height}+{x}+{y}")
        
        # Canvas transparente
        self.canvas = tk.Canvas(
            self.splash, 
            width=self.width, 
            height=self.height, 
            bg="black",  # Este color será transparente
            highlightthickness=0
        )
        self.canvas.pack()
        
        # Mostrar logo
        self.logo = self.canvas.create_image(
            self.width // 2,
            self.height // 2,
            image=self.logo_img
        )
        
        # Iniciar animación
        self.splash.attributes("-alpha", 0.0)  # Iniciar invisible
        self.fade_in()
        
    def load_logo_image(self):
        """Cargar la imagen del logo manteniendo transparencia"""
        try:
            img = Image.open(Styles.LOGO_PATH)
            # Redimensionar si es necesario (opcional)
            img.thumbnail((300, 300), Image.LANCZOS)
            self.logo_img = ImageTk.PhotoImage(img)
        except Exception as e:
            print(f"Error cargando logo: {e}")
            # Fallback simple
            self.logo_img = tk.PhotoImage(width=1, height=1)
            self.width, self.height = 300, 300

    def fade_in(self):
        """Efecto de aparición suave"""
        current_alpha = float(self.splash.attributes("-alpha"))
        if current_alpha < 1.0:
            current_alpha += 0.05
            self.splash.attributes("-alpha", current_alpha)
            self.splash.after(30, self.fade_in)
        else:
            # Esperar 1 segundo y luego desvanecer
            self.splash.after(1000, self.fade_out)

    def fade_out(self):
        """Efecto de desvanecimiento con movimiento"""
        current_alpha = float(self.splash.attributes("-alpha"))
        if current_alpha > 0:
            # Reducir opacidad
            current_alpha -= 0.05
            self.splash.attributes("-alpha", current_alpha)
            
            # Mover ligeramente (efecto flotante)
            x, y = self.get_drift_direction()
            current_x = int(self.splash.geometry().split("+")[1])
            current_y = int(self.splash.geometry().split("+")[2])
            self.splash.geometry(f"+{current_x + x}+{current_y + y}")
            
            self.splash.after(30, self.fade_out)
        else:
            self.splash.destroy()
            if self.on_complete:
                self.root.after(100, self.on_complete)

    def get_drift_direction(self):
        """Dirección aleatoria para el desvanecimiento"""
        directions = [
            (4, 0),   # Derecha
            # (-2, 0),  # Izquierda
            # (0, 2),   # Abajo
            # (0, -2),  # Arriba
            # (2, 1),   # Diagonal derecha-abajo
            # (-2, -1)  # Diagonal izquierda-arriba
        ]
        return random.choice(directions)