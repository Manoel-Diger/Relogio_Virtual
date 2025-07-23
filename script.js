class DigitalAnalogClock {
    constructor() {
        // Cache dos elementos DOM
        this.digitalElement = document.querySelector('.digital');
        this.secondHand = document.querySelector('.p_s');
        this.minuteHand = document.querySelector('.p_m');
        this.hourHand = document.querySelector('.p_h');
        this.clockContainer = document.querySelector('.relogio');
        
        // Controle de animação
        this.animationId = null;
        this.isRunning = false;
        
        // Configurações
        this.config = {
            updateInterval: 1000,
            smoothAnimation: true,
            format24h: true
        };
        
        // Bind dos métodos
        this.updateClock = this.updateClock.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        // Inicialização
        this.init();
    }
    
    init() {
        // Verificar se todos os elementos existem
        if (!this.validateElements()) {
            console.error('Elementos do relógio não encontrados');
            return;
        }
        
        // Configurar listeners
        this.setupEventListeners();
        
        // Iniciar relógio
        this.start();
        
        // Primeira atualização imediata
        this.updateClock();
    }
    
    validateElements() {
        return this.digitalElement && 
               this.secondHand && 
               this.minuteHand && 
               this.hourHand;
    }
    
    setupEventListeners() {
        // Pausar quando a aba não estiver visível (economizar bateria)
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Listener para mudança de configuração (futuro)
        this.clockContainer?.addEventListener('click', this.toggleFormat.bind(this));
        
        // Cleanup quando sair da página
        window.addEventListener('beforeunload', () => this.stop());
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }
    
    updateClock() {
        try {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            const milliseconds = now.getMilliseconds();
            
            // Atualizar display digital
            this.updateDigitalDisplay(hours, minutes, seconds);
            
            // Atualizar ponteiros analógicos
            this.updateAnalogDisplay(hours, minutes, seconds, milliseconds);
            
        } catch (error) {
            console.error('Erro ao atualizar relógio:', error);
        }
    }
    
    updateDigitalDisplay(hours, minutes, seconds) {
        const displayHours = this.config.format24h ? hours : this.convertTo12Hour(hours);
        const period = this.config.format24h ? '' : ` ${hours >= 12 ? 'PM' : 'AM'}`;
        
        const timeString = `${this.padZero(displayHours)}:${this.padZero(minutes)}:${this.padZero(seconds)}${period}`;
        
        if (this.digitalElement.textContent !== timeString) {
            this.digitalElement.textContent = timeString;
            // Efeito sutil de pulsação apenas nos segundos
            if (seconds % 2 === 0) {
                this.digitalElement.classList.add('pulse');
                setTimeout(() => this.digitalElement.classList.remove('pulse'), 150);
            }
        }
        
        // Atualizar data
        this.updateDateDisplay();
    }
    
    updateDateDisplay() {
        const dateElement = document.querySelector('.date');
        const weekdayElement = document.getElementById('weekday');
        const timezoneElement = document.getElementById('timezone');
        
        if (dateElement || weekdayElement || timezoneElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            const dateString = now.toLocaleDateString('pt-BR', options);
            const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });
            const timezone = 'Brasilia';
            
            if (dateElement) dateElement.textContent = dateString;
            if (weekdayElement) weekdayElement.textContent = weekday;
            if (timezoneElement) timezoneElement.textContent = timezone;
        }
    }
    
    updateAnalogDisplay(hours, minutes, seconds, milliseconds = 0) {
        // Cálculo mais preciso e suave dos ângulos
        let secondAngle, minuteAngle, hourAngle;
        
        if (this.config.smoothAnimation) {
            // Animação ultra suave com interpolação
            const secondProgress = (seconds + milliseconds / 1000) / 60;
            const minuteProgress = (minutes + secondProgress) / 60;
            const hourProgress = ((hours % 12) + minuteProgress) / 12;
            
            secondAngle = (secondProgress * 360) - 90;
            minuteAngle = (minuteProgress * 360) - 90;
            hourAngle = (hourProgress * 360) - 90;
        } else {
            secondAngle = (seconds * 6) - 90;
            minuteAngle = (minutes * 6 + seconds * 0.1) - 90;
            hourAngle = ((hours % 12) * 30 + minutes * 0.5) - 90;
        }
        
        // Aplicar transformações com transições otimizadas
        requestAnimationFrame(() => {
            this.setHandRotation(this.secondHand, secondAngle);
            this.setHandRotation(this.minuteHand, minuteAngle);
            this.setHandRotation(this.hourHand, hourAngle);
        });
    }
    
    setHandRotation(element, angle) {
        if (element) {
            element.style.transform = `rotate(${angle}deg)`;
        }
    }
    
    convertTo12Hour(hours) {
        if (hours === 0) return 12;
        if (hours > 12) return hours - 12;
        return hours;
    }
    
    padZero(number) {
        return number < 10 ? `0${number}` : number.toString();
    }
    
    toggleFormat() {
        this.config.format24h = !this.config.format24h;
        this.updateClock(); // Atualizar imediatamente
    }
    
    // Métodos de controle
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animationId = setInterval(this.updateClock, this.config.updateInterval);
        }
    }
    
    stop() {
        if (this.animationId) {
            clearInterval(this.animationId);
            this.animationId = null;
            this.isRunning = false;
        }
    }
    
    pause() {
        this.stop();
    }
    
    resume() {
        this.start();
        this.updateClock(); // Atualizar imediatamente ao retomar
    }
    
    // Método para alterar configurações
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }
    
    // Cleanup
    destroy() {
        this.stop();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('beforeunload', () => this.stop());
    }
}

// Inicializar o relógio quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se já existe uma instância
    if (window.clock) {
        window.clock.destroy();
    }
    
    // Criar nova instância
    window.clock = new DigitalAnalogClock();
});

// Exportar para uso como módulo (se necessário)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DigitalAnalogClock;
}