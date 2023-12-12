class BudgetItem {
    constructor(id, description, amount, percentOfTotal) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.percentOfTotal = percentOfTotal;
    }
}

class Budget {
    constructor() {
        this.balance = +localStorage.getItem("balance") ?? 0;
        this.incomes = JSON.parse(localStorage.getItem("incomes")) ?? [];
        this.incomesTotal = +localStorage.getItem("incomes-total") ?? 0
        this.expenses = JSON.parse(localStorage.getItem("expenses")) ?? [];
        this.expensesTotal = +localStorage.getItem("expenses-total") ?? 0;
    }

    // Getters
    getBalance() {
        return this.balance;
    }

    getIncomes() {
        return this.incomes;
    }

    getIncomesTotal() {
        return this.incomesTotal;
    }

    getExpenses() {
        return this.expenses;
    }

    getExpensesTotal() {
        return this.expensesTotal;
    }

    // Income functions
    addIncome(description, amount) {
        const incomeId = this.getNextId(this.incomes);
        this.balance += amount;
        this.incomesTotal += amount;
        this.incomes.push(new BudgetItem(incomeId, description, amount, 0));
        this.incomes = this.recalculateBudgetListPercentages(this.incomes, this.incomesTotal);
        this.commitIncomes();
    }

    deleteIncome(id) {
        const amount = this.incomes.filter(income => income.id === id)[0].amount;
        this.balance -= amount;
        this.incomesTotal -= amount;
        this.incomes = this.incomes.filter(income => income.id !== id);
        this.incomes = this.recalculateBudgetListPercentages(this.incomes, this.incomesTotal);
        this.commitIncomes();
    }

    commitIncomes() {
        localStorage.setItem("balance", this.balance);
        localStorage.setItem("incomes", JSON.stringify(this.incomes));
        localStorage.setItem("incomes-total", this.incomesTotal);
        this.incomesUpdated();
    }

    bindIncomeUpdate(callback) {
        this.incomesUpdated = callback;
    }

    // Expense functions
    addExpense(description, amount) {
        const expenseId = this.getNextId(this.expenses);
        this.expensesTotal += amount;
        this.balance -= amount;
        this.expenses.push(new BudgetItem(expenseId, description, amount, 0));
        this.expenses = this.recalculateBudgetListPercentages(this.expenses, this.expensesTotal);
        this.commitExpenses();
    }
    deleteExpense(id) {
        const amount = this.expenses.filter(expense => expense.id === id)[0].amount;
        this.balance += amount;
        this.expensesTotal -= amount;
        this.expenses = this.expenses.filter(expense => expense.id !== id);
        this.expenses = this.recalculateBudgetListPercentages(this.expenses, this.expensesTotal);
        this.commitExpenses();
    }

    commitExpenses() {
        localStorage.setItem("balance", this.balance);
        localStorage.setItem("expenses", JSON.stringify(this.expenses));
        localStorage.setItem("expenses-total", this.expensesTotal);
        this.expensesUpdated();
    }

    bindExpensesUpdate(callback) {
        this.expensesUpdated = callback;
    }

    // Utility functions
    getNextId(budgetItemList) {
        const newId = budgetItemList.length > 0 ? budgetItemList[budgetItemList.length-1].id + 1 : 1;
        return newId;
    }
    recalculateBudgetListPercentages(budgetItemList, listTotal) {
        return budgetItemList.map(budgetItem => {
            const percent = this.round((budgetItem.amount / listTotal) * 100 , 1);
            return {...budgetItem, percentOfTotal: percent}
        });
    }

    round(value, precision) {
        const multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }
}

class View {

    constructor() {
        this.balance = this.getElement("balance");

        this.budgetType = this.getElement("budget-type");
        this.budgetAmount = this.getElement("budget-amount");
        this.budgetDesc = this.getElement("budget-desc");
        this.budgetSubmit = this.getElement("budget-submit");

        this.incomesList = this.getElement("income-list");
        this.incomesTotal = this.getElement("incomes-total");

        this.expenseList = this.getElement("expense-list");
        this.expensesTotal = this.getElement("expenses-total")
    }

    displayBalance(balance) {
        this.balance.innerText = String(balance);
    }

    //Income functions
    displayIncomes(incomes) {
        this.displayBudgetItemList(incomes, this.incomesList);
    }
    displayIncomesTotal(incomesTotal) {
        this.incomesTotal.innerText = incomesTotal;
    }

    // Expense functions
    displayExpenses(expenses) {
        this.displayBudgetItemList(expenses, this.expenseList);
    }
    displayExpensesTotal(expensesTotal) {
        this.expensesTotal.innerText = expensesTotal;
    }

    // Shared function to display list of incomes / expenses
    displayBudgetItemList(budgetItems, container) {
        container.innerHTML = "";
        if(budgetItems.length > 0) {
            budgetItems.forEach(item => {
                const row = this.createElement("div", "budget-type-subcontainer");
                row.id = item.id;

                const description = this.createElement("span", "budget-desc");
                description.innerText = item.description;

                const amount = this.createElement("span", "budget-amount");
                amount.innerText = `$${item.amount}`;

                const percentage = this.createElement("span", "budget-percent");
                percentage.innerText = `${item.percentOfTotal}%`;

                const deleteContainer = this.createElement("span", "budget-delete");
                const deleteButton = this.createElement("button", "delete-button");
                deleteButton.id = "delete-button";
                deleteContainer.append(deleteButton);

                row.append(description, amount, percentage, deleteContainer);
                container.append(row);
            });
        } else {
            const row = this.createElement("div", "budget-type-subcontainer empty-row");
            container.append(row);
        }

    }

    // Event binders
    bindBudgetSubmit(handler) {
        this.budgetSubmit.addEventListener("click", _ => {
           if (this.budgetDesc.value.trim() !== "" && Number(this.budgetAmount.value) > 0) {
               handler(this.budgetDesc.value, +this.budgetAmount.value, this.budgetType.value);
               this.budgetDesc.value = "";
               this.budgetAmount.value = "";
               this.budgetType.value = "income";
           }
        });
    }
    bindDeleteIncome(handler) {
        this.incomesList.addEventListener("click", event => {
            if (event.target.id != "delete-button") return;
            const id = event.target.parentElement.parentElement.id;
            handler(+id);
        })
    }
    bindDeleteExpense(handler) {
        this.expenseList.addEventListener("click", event => {
            if (event.target.id !== "delete-button") return;
            const id = event.target.parentElement.parentElement.id;
            handler(+id);
        });
    }

    // Utility functions
    createElement(tag, className = "") {
        const element = document.createElement(tag);
        element.className = className;
        return element;
    }

    getElement(id) {
        return document.getElementById(id);
    }
}

class Controller {

    constructor() {
        this.budget = new Budget();
        this.view = new View();

        // Binders for events coming from the UI
        this.view.bindBudgetSubmit(this.handleAddBudgetItem);
        this.view.bindDeleteExpense(this.handleDeleteExpense);
        this.view.bindDeleteIncome(this.handleDeleteIncome);

        // Setup for callbacks on data updates
        this.budget.bindIncomeUpdate(this.redisplayIncomes.bind(this));
        this.budget.bindExpensesUpdate(this.redisplayExpenses.bind(this));

        // Setup initial view
        this.redisplayIncomes();
        this.redisplayExpenses();
    }

    // Event handlers
    handleAddBudgetItem = (description, amount, type) => {
        if (type === "income") {
            this.budget.addIncome(description, amount);
        } else if (type === "expense") {
            this.budget.addExpense(description, amount);
        }
    }

    handleDeleteIncome = (id) => {
        const incomeIds = this.budget.incomes.map(income => income.id);
        // Guard statement to ensure id is in incomes array
        if (!incomeIds.includes(id)) return;
        this.budget.deleteIncome(id);
    }

    handleDeleteExpense = (id) => {
        const expenseIds = this.budget.expenses.map(expense => expense.id);
        // Guard statement to ensure id is in expenses array
        if (!expenseIds.includes(id)) return;
        this.budget.deleteExpense(id);
    }

    // Display functions
    redisplayIncomes() {
        this.view.displayBalance(this.budget.getBalance());
        this.view.displayIncomes(this.budget.getIncomes());
        this.view.displayIncomesTotal(this.budget.getIncomesTotal());
    }
    redisplayExpenses() {
        this.view.displayBalance(this.budget.getBalance());
        this.view.displayExpenses(this.budget.getExpenses());
        this.view.displayExpensesTotal(this.budget.getExpensesTotal());
    }
}

const app = new Controller();