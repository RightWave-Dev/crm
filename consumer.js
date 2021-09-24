const config = require('./config/database');
const mongoose = require('mongoose');
const CrmLeadExport =require('./model/CrmLeadExport');
const Property = require('./model/Property');
const amqp = require('amqplib/callback_api');

// For database connection 
mongoose.connect(config.database, {useUnifiedTopology: true, useNewUrlParser: true});

mongoose.connection.on('connected', () => {
        console.log(`connected to database ${config.database}`);
});

mongoose.connection.on('error', (err) => {
     console.log(`database error ${err}`);
 });

async function initConsumer(){
    // Loading properties
    const rabbitMQDetailMap = await Property.findAllByNamespaceAsMap("RabbitMQ");
    console.log("awsAuthorization "+JSON.stringify(rabbitMQDetailMap));
    const retryExchange = rabbitMQDetailMap.retryExchange ;
    console.log("retryExchange "+retryExchange);
    const crmQueue= rabbitMQDetailMap.crmQueue;
    console.log("crmQueue "+crmQueue);
    let maxRetriesLimit=parseInt(rabbitMQDetailMap.maxRetriesLimit);
    if(isNaN(maxRetriesLimit)) 
        maxRetriesLimit = 3;
    console.log("maxRetriesLimit "+maxRetriesLimit);

    // Initializing the consumer on crmQueue  
    try {
        amqp.connect({ protocol:'amqps' , hostname: rabbitMQDetailMap.hostname ,port:rabbitMQDetailMap.port, username:rabbitMQDetailMap.username,password:rabbitMQDetailMap.password}, function(connectionError, connection) {
            if (connectionError) {
                console.error(connectionError);
                throw connectionError;
            }
            connection.createChannel(function(channelError, channel) {
                if (channelError) {
                    console.error(channelError);
                    throw channelError;
                }
                channel.consume(crmQueue, async function(msg) {
                
                    console.log(" Message recieved from the Queue", msg.content.toString());
                    try{
                        let messageJson={};
                        try{
                            messageJson = JSON.parse(msg.content);
                            console.log(messageJson);
                        }
                        catch(messageError){
                            console.error("Error  "+messageError);
                        } 
                        if(messageJson.crmLeadExportId)
                        {
                            let crmLead ;
                            console.log("starting message processing for crmLeadExportId "+messageJson.crmLeadExportId );
                            try { 
                            crmLead= await CrmLeadExport.get(messageJson.crmLeadExportId) ;
                            } catch(crmLeadError)
                            {
                                console.error("Error while getting the crmLead Object ."+crmLeadError)
                            }
                            console.log("crmLeadExport object = "+crmLead);
                            
                            if(crmLead && crmLead.retryCount < maxRetriesLimit && crmLead.status && (crmLead.status.toLowerCase()=='new' || crmLead.status.toLowerCase()=='retry') )
                            {
                                let publishForRetry=false ;
                                let crmErrors;
                                if(crmLead.crm && crmLead.organizationId && crmLead.templateId )
                                {
                                    let result;
                                    try
                                    {
                                        // Name of the handler file should start with the value of the crm in crmLeadExport and should have a suffix 'Handler' .
                                        const crm =require('./handlers/'+crmLead.crm.toLowerCase()+'Handler');
                                        result = await crm.processLead(crmLead) ; 
                                    }catch(crmError){
                                        console.error("Error occured while processing leads "+crmError +"Stack : "+crmError.stack);
                                        crmErrors=crmError.toString();
                                    }
                                    if(result)
                                    {
                                        console.log("Result from Marketo "+JSON.stringify(result));
                                        if(result.success){
                                            crmLead.status = "sent" ;
                                            crmLead.successResponse={requestId:result.requestId,response:result.response};
                                        }
                                        else{
                                           crmLead.retryCount++;
                                           console.log("Pushing the failure response to failureResponse .")
                                           crmLead.failureResponse.push({requestId:result.requestId,response:result.response});
                                           if(crmLead==maxRetriesLimit)
                                           {
                                               crmLead.status="failed" ;
                                           }
                                           else{
                                               crmLead.status="retry";
                                               publishForRetry=true;
                                           }
                                        }
                                    }
                                    else{
                                        crmLead.status = "failed" ;
                                        if(crmErrors)
                                            crmLead.failureResponse.push({requestId:"",response:[ {reasons:crmErrors}]});
                                        else
                                            crmLead.failureResponse.push({requestId:"",response:[ {reasons:"error occured while processing the lead ."}]});
                                    }
                                }
                                else{
                                    // Case if crm / organizationId / templateId was not found in the crmLeadExport
                                    crmLead.status = "failed" ;
                                    crmLead.failureResponse.push({requestId:"",response:[ {reasons:"No crm / organizationId / templateId Found in the crmLeadExport"}]});    
                                    console.log("This record has not been processed to marketo as there was no crm in the crmLeadExport ");
                                }
                                // Updating the crmLeadExportOnject
                                await CrmLeadExport.update(crmLead);
                                // Publishing the message to the retryExchange 
                                if(publishForRetry) 
                                {
                                    channel.publish(retryExchange,'',Buffer.from(JSON.stringify(messageJson)));
                                }
                        }
                        else{
                            console.log("Maximum retries reached or the Lead is already exported to Marketo or lead crmLeadExport was not found .")
                        }
                        }
                        else {
                           console.log("No crmLeadExport id was found in message .");
                        }
                    }catch(err)
                    {
                        console.error(" Error ====>>> This message cannot be processed .."+err.toString() );
                    }
                    // If the message is processed then send a acknowledgement .. 
                    console.log("message processing finished waiting for the next message ..");
                    channel.ack(msg);
                },
                {
                    noAck: false
                });
            });
        });
    }
    catch(error){
        console.error("not able to create connection with rabbit Mq because of following error"+error) ;
    } 
}

initConsumer();
  