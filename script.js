const monthYearElement = document.getElementById('month-year');
const calendarDaysElement = document.getElementById('calendar-days');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

let currentDate = new Date();

function renderCalendar() {
    calendarDaysElement.innerHTML = ""; // Limpa o calendário

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Define o título (Mês e Ano)
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    monthYearElement.innerText = `${monthNames[month]} ${year}`;

    // Primeiro dia da semana do mês atual (0-6)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Último dia do mês atual
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Criar espaços vazios para alinhar o primeiro dia do mês
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day', 'empty');
        calendarDaysElement.appendChild(emptyDiv);
    }

    // Criar os dias do mês
    for (let day = 1; day <= lastDay; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('day');
        dayElement.innerText = day;

        // Destaca o dia atual
        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayElement.classList.add('today');
        }

        calendarDaysElement.appendChild(dayElement);
    }
}

// Eventos dos botões
prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// Inicialização
renderCalendar();
