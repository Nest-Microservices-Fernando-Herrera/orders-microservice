import { Catch, ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { RpcException } from '@nestjs/microservices'

// Utiliza el decorador @Catch para indicar que este filtro manejará excepciones de tipo RpcException.
@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {

    // El método 'catch' es el que se ejecutará cuando se capture una excepción de tipo RpcException.
    // 'exception' es la excepción capturada, y 'host' es el contexto de los argumentos.
    catch(exception: RpcException, host: ArgumentsHost) {
        // Obtiene el contexto HTTP desde los argumentos.
        const ctx = host.switchToHttp();
        // Obtiene el objeto de respuesta HTTP.
        const response = ctx.getResponse();

        // Obtiene el error desde la excepción RPC.
        const rpcError = exception.getError(); 
        console.log({ rpcError }); 

        // Verificando si es un objeto y tiene las siguientes propiedades
        if (
            typeof rpcError === 'object' &&
            'status' in rpcError &&
            'message' in rpcError
        ) {
            // Si el 'status' no es un número, establece el estado a 400 (Bad Request).
            const status = isNaN(+rpcError.status) ? 400 : rpcError.status;
            // Envía la respuesta HTTP con el estado y el mensaje de error.
            return response.status(status).json(rpcError);
        }

        // Si el error no tiene las propiedades esperadas, envía una respuesta con estado 400 y el mensaje de error.
        response.status(400).json({
            status: 400,
            message: rpcError
        });
    }
}
