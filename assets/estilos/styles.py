import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
import os
import sys
from PIL import Image, ImageTk

def get_resource_path(relative_path):
    """Obtiene la ruta absoluta para recursos, funciona para desarrollo y para PyInstaller"""
    try:
        # PyInstaller crea una carpeta temporal y almacena la ruta en _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

class ToolTip:
    def __init__(self, widget, text):
        self.widget = widget
        self.text = text
        self.tipwindow = None
        widget.bind("<Enter>", self.show_tip)
        widget.bind("<Leave>", self.hide_tip)

    def show_tip(self, event=None):
        if self.tipwindow or not self.text:
            return
        x, y, _, _ = self.widget.bbox("insert")
        x += self.widget.winfo_rootx() + 20
        y += self.widget.winfo_rooty() + 20
        self.tipwindow = tw = tk.Toplevel(self.widget)
        tw.wm_overrideredirect(True)
        tw.wm_geometry(f"+{x}+{y}")
        label = tk.Label(
            tw, text=self.text, justify="left",
            background="#ffffe0", relief="solid", borderwidth=1,
            font=("Segoe UI", 9)
        )
        label.pack(ipadx=5, ipady=2)

    def hide_tip(self, event=None):
        if self.tipwindow:
            self.tipwindow.destroy()
            self.tipwindow = None


class Styles:
    
    LOGO_PATH = get_resource_path(os.path.join("assets", "iconos", "LOGO.png"))
    ICON_PATH = get_resource_path(os.path.join("assets", "iconos", "icono.ico"))
    
    # Retro Dark Mode Color Palette
    # Primary Colors
        # Primary Colors (azul retro)
    COLOR_PRIMARY = "#2A2A5A"          # Azul oscuro retro
    COLOR_PRIMARY_LIGHT = "#3A3A6A"    # Azul medio retro
    COLOR_PRIMARY_DARK = "#1A1A3A"     # Azul muy oscuro retro

    # Secondary Colors (complementarios)
    COLOR_SECONDARY = "#5A2A5A"        # Lavanda profundo (lavanda oscuro)
    COLOR_SECONDARY_LIGHT = "#7A4C7A"  # Lavanda medio
    COLOR_SECONDARY_DARK = "#3A1A3A"   # Lavanda muy oscuro

    # Accent Colors (lavanda en vez de naranja)
    COLOR_ACCENT = "#B38BFA"           # Lavanda pastel brillante
    COLOR_ACCENT_LIGHT = "#D5BFFF"     # Lavanda claro
    COLOR_ACCENT_DARK = "#9166CC"      # Lavanda oscuro

    # Neutral Colors (fondo oscuro)
    COLOR_BACKGROUND = "#121212"       # Fondo negro oscuro
    COLOR_TEXT = "#E0E0E0"             # Texto blanco brillante
    COLOR_TEXT_LIGHT = "#A0A0A0"       # Texto gris claro
    COLOR_BORDER = "#404040"           # Bordes grises oscuros

    # State Colors (brillantes para contraste)
    COLOR_SUCCESS = "#00C853"          # Verde brillante retro
    COLOR_ERROR = "#FF3D00"            # Rojo brillante retro
    COLOR_WARNING = "#FFAB00"          # Amarillo brillante retro

    
    # Fonts with retro style
    FONT_FAMILY = "Poppins Bold"        # Fuente tipo máquina de escribir para estilo retro
    FONT = (FONT_FAMILY, 10)
    FONT_BOLD = (FONT_FAMILY, 10, "bold")
    FONT_LARGE = (FONT_FAMILY, 16, "bold")
    FONT_SMALL = (FONT_FAMILY, 10)

    # Alignment and Spacing
    ALIGNMENT_CENTER = "center"
    PADDING = 10
    PADDING_SMALL = 5
    PADDING_LARGE = 15
    
    # Splash Screen Specific Styles
    SPLASH_WIDTH = 400
    SPLASH_HEIGHT = 300
    SPLASH_PROGRESS_HEIGHT = 8
    SPLASH_PROGRESS_WIDTH = 250
    
    @staticmethod
    def configure_splash(splash_window):
        """Apply splash screen specific styling"""
        splash_window.configure(background=Styles.COLOR_BACKGROUND)
        splash_window.overrideredirect(True)
        
        # Center splash window
        screen_width = splash_window.winfo_screenwidth()
        screen_height = splash_window.winfo_screenheight()
        x = (screen_width // 2) - (Styles.SPLASH_WIDTH // 2)
        y = (screen_height // 2) - (Styles.SPLASH_HEIGHT // 2)
        splash_window.geometry(f"{Styles.SPLASH_WIDTH}x{Styles.SPLASH_HEIGHT}+{x}+{y}")
    
    @staticmethod
    def get_splash_progress_style():
        """Return style configuration for splash progress bar"""
        return {
            'background': Styles.COLOR_ACCENT,
            'trough_color': Styles.COLOR_BACKGROUND,
            'border_width': 0,
            'height': Styles.SPLASH_PROGRESS_HEIGHT
        }
    
    @staticmethod
    def get_splash_text_style():
        """Return style configuration for splash text"""
        return {
            'font': Styles.FONT,
            'fill': Styles.COLOR_ACCENT  # Texto en color de acento para destacar
        }
    
    @staticmethod
    def get_splash_percent_style():
        """Return style configuration for percentage text"""
        return {
            'font': (Styles.FONT_FAMILY, 12, "bold"),
            'fill': Styles.COLOR_ACCENT  # Porcentaje en color de acento
        }

    @staticmethod
    def apply_styles():
        """Apply comprehensive custom styles to ttk widgets"""
        style = ttk.Style()
        style.theme_use("clam")  # Base para tema oscuro

        # Button Styles
        style.configure(
            "Custom.TButton",
            font=Styles.FONT,
            padding=(Styles.PADDING, Styles.PADDING_SMALL),
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_PRIMARY,
            bordercolor=Styles.COLOR_BORDER,
            relief="raised",  # Relieve para efecto retro
            focuscolor=Styles.COLOR_ACCENT_LIGHT
        )
        style.map(
            "Custom.TButton",
            background=[
                ("pressed", Styles.COLOR_PRIMARY_DARK), 
                ("active", Styles.COLOR_ACCENT),
                ("disabled", Styles.COLOR_TEXT_LIGHT)
            ],
            foreground=[
                ("pressed", Styles.COLOR_TEXT), 
                ("active", Styles.COLOR_TEXT),
                ("disabled", Styles.COLOR_BACKGROUND)
            ],
            bordercolor=[
                ("pressed", Styles.COLOR_ACCENT_DARK),
                ("active", Styles.COLOR_ACCENT)
            ]
        )
        
        # Danger Button Style
        style.configure(
            "Danger.TButton", 
            font=Styles.FONT,
            padding=(Styles.PADDING, Styles.PADDING_SMALL),
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_ERROR,
            bordercolor=Styles.COLOR_BORDER,
            relief="raised",
            focuscolor=Styles.COLOR_ACCENT_LIGHT
        )
        style.map(
            "Danger.TButton", 
            background=[
                ("pressed", Styles.COLOR_ERROR), 
                ("active", Styles.COLOR_WARNING),
                ("disabled", Styles.COLOR_TEXT_LIGHT)
            ],
            foreground=[
                ("pressed", Styles.COLOR_TEXT), 
                ("active", Styles.COLOR_TEXT),
                ("disabled", Styles.COLOR_BACKGROUND)
            ],
            bordercolor=[
                ("pressed", Styles.COLOR_ACCENT_DARK),
                ("active", Styles.COLOR_ACCENT)
            ]
        )

        # Label Styles
        style.configure(
            "Custom.TLabel",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_BACKGROUND,
            padding=Styles.PADDING_SMALL
        )
        
        style.configure(
            "Custom.Header.TLabel",
            font=Styles.FONT_LARGE,
            foreground=Styles.COLOR_TEXT_LIGHT,  # Encabezados en color de acento
            background=Styles.COLOR_BACKGROUND,
            padding=Styles.PADDING
        )
        
        # Configuración del estilo para TLabelframe
        style.configure(
            "Custom.TLabelframe",
            font=Styles.FONT_BOLD,
            foreground=Styles.COLOR_ACCENT,  # Texto en color de acento
            background=Styles.COLOR_BACKGROUND,
            borderwidth=2,
            relief="groove"  # Relieve retro
        )
        
        # Configuración para TLabelframe.Label
        style.configure(
            "Custom.TLabelframe.Label",
            font=Styles.FONT_BOLD,
            foreground=Styles.COLOR_ACCENT,  # Texto en color de acento
            background=Styles.COLOR_BACKGROUND
        )

        # Entry Styles
        style.configure(
            "Custom.TEntry",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background="#1E1E1E",  # Fondo ligeramente más claro que el principal
            fieldbackground="#1E1E1E",
            bordercolor=Styles.COLOR_BORDER,
            lightcolor=Styles.COLOR_BACKGROUND,
            darkcolor=Styles.COLOR_BACKGROUND,
            padding=(Styles.PADDING_SMALL, Styles.PADDING_SMALL),
            relief="sunken"  # Relieve retro
        )
        style.map(
            "Custom.TEntry",
            bordercolor=[
                ("focus", Styles.COLOR_ACCENT),
                ("!focus", Styles.COLOR_BORDER)
            ],
            lightcolor=[
                ("focus", Styles.COLOR_ACCENT_LIGHT),
                ("!focus", Styles.COLOR_BACKGROUND)
            ]
        )
        
        # Treeview Styles
        style.configure(
            "Custom.Treeview",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background="#1E1E1E",  # Fondo ligeramente más claro
            fieldbackground="#1E1E1E",
            bordercolor=Styles.COLOR_BORDER,
            rowheight=25
        )
        
        # ScrolledText Styles
        style.configure(
            "Custom.TScrolledText",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background="#1E1E1E",
            fieldbackground="#1E1E1E",
            bordercolor=Styles.COLOR_BORDER,
            lightcolor=Styles.COLOR_BACKGROUND,
            darkcolor=Styles.COLOR_BACKGROUND,
            padding=(Styles.PADDING_SMALL, Styles.PADDING_SMALL),
            relief="sunken"
        )

        # Combobox Styles
        style.configure(
            "Custom.TCombobox",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background="#1E1E1E",
            fieldbackground="#1E1E1E",
            selectbackground=Styles.COLOR_ACCENT,
            selectforeground=Styles.COLOR_TEXT,
            arrowsize=15,
            arrowcolor=Styles.COLOR_ACCENT,  # Flechas en color de acento
            padding=(Styles.PADDING_SMALL, Styles.PADDING_SMALL)
        )
        style.map(
            "Custom.TCombobox",
            fieldbackground=[("readonly", "#1E1E1E")],
            selectbackground=[("readonly", Styles.COLOR_ACCENT)],
            background=[("readonly", "#1E1E1E")]
        )

        # Frame Styles
        style.configure(
            "Custom.TFrame",
            background=Styles.COLOR_BACKGROUND,
            relief="flat",
            bordercolor=Styles.COLOR_BORDER
        )
        
        style.configure(
            "Custom.Border.TFrame",
            background=Styles.COLOR_BORDER,
            relief="groove"  # Relieve retro
        )

        # Scrollbar Styles
        style.configure(
            "Custom.Vertical.TScrollbar",
            background=Styles.COLOR_ACCENT_DARK,
            arrowcolor=Styles.COLOR_ACCENT,
            troughcolor=Styles.COLOR_BACKGROUND,
            bordercolor=Styles.COLOR_BORDER,
            gripcount=0,
            arrowsize=15
        )
        
        style.configure(
            "Custom.Horizontal.TScrollbar",
            background=Styles.COLOR_ACCENT_DARK,
            arrowcolor=Styles.COLOR_ACCENT,
            troughcolor=Styles.COLOR_BACKGROUND,
            bordercolor=Styles.COLOR_BORDER,
            gripcount=0,
            arrowsize=15
        )
        
        style.map(
            "Custom.Vertical.TScrollbar",
            background=[("active", Styles.COLOR_ACCENT)],
            arrowcolor=[("active", Styles.COLOR_TEXT)]
        )
        
        style.map(
            "Custom.Horizontal.TScrollbar",
            background=[("active", Styles.COLOR_ACCENT)],
            arrowcolor=[("active", Styles.COLOR_TEXT)]
        )

        # Notebook Styles (Tabs)
        style.configure(
            "Custom.TNotebook",
            background=Styles.COLOR_BACKGROUND,
            bordercolor=Styles.COLOR_BORDER,
            tabmargins=(2, 2, 2, 0)
        )
        
        style.configure(
            "Custom.TNotebook.Tab",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT_LIGHT,
            background=Styles.COLOR_BACKGROUND,
            padding=(Styles.PADDING, Styles.PADDING_SMALL),
            focuscolor=Styles.COLOR_ACCENT_LIGHT
        )
        style.map(
            "Custom.TNotebook.Tab",
            background=[
                ("selected", Styles.COLOR_ACCENT),
                ("active", Styles.COLOR_ACCENT_LIGHT)
            ],
            foreground=[
                ("selected", Styles.COLOR_TEXT),
                ("active", Styles.COLOR_TEXT)
            ],
            expand=[("selected", (1, 1, 1, 0))]
        )

        # Treeview Styles
        style.configure(
            "Custom.Treeview",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background="#1E1E1E",
            fieldbackground="#1E1E1E",
            bordercolor=Styles.COLOR_BORDER,
            rowheight=25
        )
        
        style.configure(
            "Custom.Treeview.Heading",
            font=Styles.FONT_BOLD,
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_PRIMARY,
            relief="raised",  # Relieve retro
            padding=(Styles.PADDING_SMALL, Styles.PADDING_SMALL)
        )
        
        style.map(
            "Custom.Treeview.Heading",
            background=[
                ("active", Styles.COLOR_ACCENT),
                ("pressed", Styles.COLOR_ACCENT_DARK)
            ]
        )
        
        style.map(
            "Custom.Treeview",
            background=[
                ("selected", Styles.COLOR_ACCENT)
            ],
            foreground=[
                ("selected", Styles.COLOR_TEXT)
            ]
        )

        # Progressbar Styles
        style.configure(
            "Custom.Horizontal.TProgressbar",
            background=Styles.COLOR_ACCENT,
            troughcolor=Styles.COLOR_BACKGROUND,
            bordercolor=Styles.COLOR_BORDER,
            lightcolor=Styles.COLOR_ACCENT_LIGHT,
            darkcolor=Styles.COLOR_ACCENT_DARK,
            thickness=20
        )

        # Checkbutton and Radiobutton Styles
        style.configure(
            "Custom.TCheckbutton",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_BACKGROUND,
            indicatorcolor=Styles.COLOR_BACKGROUND,
            indicatordiameter=15,
            indicatorrelief="sunken",  # Relieve retro
            padding=Styles.PADDING
        )
        
        style.configure(
            "Custom.TRadiobutton",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_BACKGROUND,
            indicatorcolor=Styles.COLOR_BACKGROUND,
            indicatordiameter=15,
            indicatorrelief="sunken",  # Relieve retro
            padding=Styles.PADDING
        )
        
        style.map(
            "Custom.TCheckbutton",
            indicatorcolor=[
                ("selected", Styles.COLOR_ACCENT),
                ("!selected", Styles.COLOR_BACKGROUND)
            ],
            background=[("active", Styles.COLOR_BACKGROUND)]
        )
        
        style.map(
            "Custom.TRadiobutton",
            indicatorcolor=[
                ("selected", Styles.COLOR_ACCENT),
                ("!selected", Styles.COLOR_BACKGROUND)
            ],
            background=[("active", Styles.COLOR_BACKGROUND)]
        )

        # Sizegrip Style
        style.configure(
            "Custom.Sizegrip",
            background=Styles.COLOR_ACCENT_DARK
        )

    @staticmethod
    def show_msg(msg, title="Information"):
        """Elegant information message"""
        messagebox.showinfo(title, msg)

    @staticmethod
    def show_msg_error(msg, title="Error"):
        """Elegant error message"""
        messagebox.showerror(title, msg)

    @staticmethod
    def show_msg_warning(msg, title="Warning"):
        """Elegant warning message"""
        messagebox.showwarning(title, msg)

    @staticmethod
    def show_confirm_yes_no(msg, title="Confirmation"):
        """Elegant confirmation dialog"""
        return messagebox.askyesno(title, msg)

    @staticmethod
    def create_custom_style(widget_type, **kwargs):
        """
        Create a custom style for specific widget types
        Example usage:
        Styles.create_custom_style('TButton', background='#ff0000', font=('Arial', 12))
        """
        style = ttk.Style()
        style_name = f'Custom.{widget_type}'
        style.configure(style_name, **kwargs)
        return style_name

    @staticmethod
    def apply_window_style(root):
        """Apply window-level styling"""
        root.configure(background=Styles.COLOR_BACKGROUND)
        try:
            root.iconbitmap(Styles.ICON_PATH)
        except Exception as e:
            print(f"Error setting window icon: {e}")
        
        # Set window title font and color
        root.option_add('*TkFDialog*foreground', Styles.COLOR_TEXT_LIGHT)  # Diálogos con texto en color de acento
        root.option_add('*TkFDialog*font', Styles.FONT)
        
        # Configure the default focus highlight
        root.option_add('*focusHighlightBackground', Styles.COLOR_BACKGROUND)
        root.option_add('*focusHighlightColor', Styles.COLOR_ACCENT)
        root.option_add('*highlightThickness', 1)
        
        # Configure selection colors
        root.option_add('*selectBackground', Styles.COLOR_ACCENT)
        root.option_add('*selectForeground', Styles.COLOR_TEXT)
        root.option_add('*selectBorderWidth', 0)