# brainsatplay-starter-kit
 Template application for the Brains@Play library

> **Note:** This template application is still under development. While the `app` directory is fully-functional, we have not linked the latest `brainsatplay` library into the `index.html` demo.

Welcome to the Brains@Play ecosystem! This starter kit will onboard you to the development of high-performance web applications using **graphs**.

While there are many ways to compose a graph, we will start with the manual declaration of a **graph tree**:

```javascript 
const tree = {
    pass: {
        tag: 'pass'
        operator: (input) => input
        children: [{
            tag: 'output'
            operator: (input) => console.log('input', input)
        }]
    }
}
```

This can then be loaded into a brainsatplay **Graph** instance: 

```javascript
    const graph = new brainsatplay.Graph(tree)
```


More coming soon...