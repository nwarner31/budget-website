class BudgetItem {

    constructor(id, description, amount, percentOfTotal) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.percentOfTotal = percentOfTotal;
    }
}

class Budget {
    #balance;
    #incomes;
    #incomesTotal;
    #expenses;
    #expensesTotal;
    constructor() {
        this.#balance = +localStorage.getItem("balance") || 0;
        this.#incomes = JSON.parse(localStorage.getItem("incomes")) || [];
        this.#incomesTotal = +localStorage.getItem("incomes-total") || 0
        this.#expenses = JSON.parse(localStorage.getItem("expenses")) || [];
        this.#expensesTotal = +localStorage.getItem("expenses-total") || 0;
    }

    // Getters
    getBalance() {
        return this.#balance;
    }

    getIncomes() {
        return this.#incomes;
    }

    getIncomesTotal() {
        return this.#incomesTotal;
    }

    getExpenses() {
        return this.#expenses;
    }

    getExpensesTotal() {
        return this.#expensesTotal;
    }

    // Income functions
    addIncome(description, amount) {
        const incomeId = this.getNextId(this.#incomes);
        this.#balance += amount;
        this.#incomesTotal += amount;
        this.#incomes.push(new BudgetItem(incomeId, description, amount, 0));
        this.#incomes = this.recalculateBudgetListPercentages(this.#incomes, this.#incomesTotal);
        this.commitIncomes();
    }

    deleteIncome(id) {
        const amount = this.#incomes.filter(income => income.id === id)[0].amount;
        this.#balance -= amount;
        this.#incomesTotal -= amount;
        this.#incomes = this.#incomes.filter(income => income.id !== id);
        this.#incomes = this.recalculateBudgetListPercentages(this.#incomes, this.#incomesTotal);
        this.commitIncomes();
    }

    commitIncomes() {
        localStorage.setItem("balance", this.#balance);
        localStorage.setItem("incomes", JSON.stringify(this.#incomes));
        localStorage.setItem("incomes-total", this.#incomesTotal);
    }

    // Expense functions
    addExpense(description, amount) {
        const expenseId = this.getNextId(this.#expenses);
        this.#expensesTotal += amount;
        this.#balance -= amount;
        this.#expenses.push(new BudgetItem(expenseId, description, amount, 0));
        this.#expenses = this.recalculateBudgetListPercentages(this.#expenses, this.#expensesTotal);
        this.commitExpenses();
    }
    deleteExpense(id) {
        const amount = this.#expenses.filter(expense => expense.id === id)[0].amount;
        this.#balance += amount;
        this.#expensesTotal -= amount;
        this.#expenses = this.#expenses.filter(expense => expense.id !== id);
        this.#expenses = this.recalculateBudgetListPercentages(this.#expenses, this.#expensesTotal);
        this.commitExpenses();
    }

    commitExpenses() {
        localStorage.setItem("balance", this.#balance);
        localStorage.setItem("expenses", JSON.stringify(this.#expenses));
        localStorage.setItem("expenses-total", this.#expensesTotal);
    }


    // Utility functions
    getNextId(budgetItemList) {
        return budgetItemList.length > 0 ? budgetItemList[budgetItemList.length-1].id + 1 : 1;
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

        this.view.getElement("budget-submit").addEventListener("click", this.handleAddBudgetItem);
        this.view.incomesList.addEventListener("click", this.handleDeleteIncome);
        this.view.expenseList.addEventListener("click", this.handleDeleteExpense);

        // Setup initial view
        this.redisplayIncomes();
        this.redisplayExpenses();
    }

    // Event handlers

    handleAddBudgetItem = () => {

        const budgetItemType = this.view.getElement("budget-type");
        const budgetItemDesc = this.view.getElement("budget-desc");
        const budgetItemAmount = this.view.getElement("budget-amount");
        if (budgetItemDesc.value.trim() !== "" && Number(budgetItemAmount.value) > 0) {
            if (budgetItemType.value === "income") {
                this.budget.addIncome(budgetItemDesc.value, +budgetItemAmount.value);
                this.redisplayIncomes();
            } else if (budgetItemType.value === "expense") {
                this.budget.addExpense(budgetItemDesc.value, +budgetItemAmount.value);
                this.redisplayExpenses();
            }
            budgetItemDesc.value = "";
            budgetItemAmount.value = "";
            budgetItemType.value = "income";
        }
    }

    handleDeleteIncome = (event) => {
        if (event.target.id !== "delete-button") return;
        const id = +event.target.parentElement.parentElement.id;
        const incomeIds = this.budget.getIncomes().map(income => income.id);
        // Guard statement to ensure id is in incomes array
        if (!incomeIds.includes(id)) return;
        this.budget.deleteIncome(id);
        this.redisplayIncomes();
    }

    handleDeleteExpense = (event) => {
        if (event.target.id !== "delete-button") return;
        const id = +event.target.parentElement.parentElement.id;
        const expenseIds = this.budget.getExpenses().map(expense => expense.id);
        // Guard statement to ensure id is in expenses array
        if (!expenseIds.includes(id)) return;
        this.budget.deleteExpense(id);
        this.redisplayExpenses();
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

new Controller();